"""
Synthesises the site's sound: background ambience, the opening-film
soundtrack, Video 2's sound, and the sound bed under the bedroom voice.
Everything is generated from noise and oscillators; no recorded samples.

Usage:  python3 tools/media/audio.py <out_dir>
Writes WAV files that build.sh then encodes with ffmpeg.
"""
import sys
import wave

import numpy as np

SR = 44100
rng = np.random.default_rng(1050)


def t_axis(seconds):
    return np.arange(int(seconds * SR)) / SR


def brown(n):
    x = np.cumsum(rng.standard_normal(n))
    x -= np.linspace(x[0], x[-1], n)  # remove drift (band-passing later removes the rest)
    return x / (np.abs(x).max() + 1e-9)


def fft_band(x, lo, hi):
    """Band-pass by zeroing FFT bins (fine for offline synthesis)."""
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X[(f < lo) | (f > hi)] = 0
    return np.fft.irfft(X, len(x))


def smooth_env(n, points):
    """Piecewise-linear envelope from (time_s, value) points."""
    t = np.arange(n) / SR
    ts, vs = zip(*points)
    return np.interp(t, ts, vs)


def wind(seconds, lo=150, hi=900, gust_rate=0.07):
    n = int(seconds * SR)
    w = fft_band(brown(n) + 0.15 * rng.standard_normal(n), lo, hi)
    w /= np.abs(w).max() + 1e-9
    t = t_axis(seconds)
    gust = 0.55 + 0.3 * np.sin(2 * np.pi * gust_rate * t) + 0.15 * np.sin(2 * np.pi * gust_rate * 2.7 * t + 1.3)
    return w * gust


def drone(seconds, f0=55.0):
    t = t_axis(seconds)
    vib = 1 + 0.002 * np.sin(2 * np.pi * 0.11 * t)
    x = np.zeros_like(t)
    for mult, amp in [(1, 1.0), (1.5, 0.35), (2, 0.25), (3, 0.08)]:
        x += amp * np.sin(2 * np.pi * f0 * mult * vib * t + rng.uniform(0, 6))
    swell = 0.6 + 0.4 * np.sin(2 * np.pi * t / seconds * 2 - np.pi / 2) ** 2
    return x / np.abs(x).max() * swell


def leaf_step(intensity=1.0):
    """One footstep on dry leaves: a dull thud plus a burst of crackle."""
    n = int(0.32 * SR)
    t = np.arange(n) / SR
    thud = np.sin(2 * np.pi * 70 * t) * np.exp(-t * 28) * 0.5
    crackle = np.zeros(n)
    hits = rng.integers(0, int(0.22 * SR), 70)
    crackle[hits] = rng.uniform(-1, 1, hits.size)
    crackle = fft_band(crackle + 0.25 * rng.standard_normal(n) * np.exp(-t * 18), 1500, 9000)
    crackle /= np.abs(crackle).max() + 1e-9
    return intensity * (thud + 0.55 * crackle * np.exp(-t * 9))


def chirp(f_start, f_end, dur):
    t = t_axis(dur)
    f = np.linspace(f_start, f_end, t.size)
    phase = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(phase) * np.sin(np.pi * t / dur) ** 2


def knock():
    t = t_axis(0.35)
    body = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t * d) for f, a, d in [(118, 1.0, 22), (240, 0.5, 30), (410, 0.25, 45)])
    click = fft_band(rng.standard_normal(t.size) * np.exp(-t * 300), 800, 5000)
    return body + 0.6 * click / (np.abs(click).max() + 1e-9)


def creak(dur, f_lo=60, f_hi=220, bright=2400):
    """Stick-slip creak: an irregular pulse train swept in pitch."""
    t = t_axis(dur)
    f = f_lo + (f_hi - f_lo) * (0.5 - 0.5 * np.cos(np.pi * t / dur)) * (1 + 0.15 * np.sin(2 * np.pi * 3.1 * t))
    f *= 1 + 0.06 * rng.standard_normal(t.size).cumsum() / np.sqrt(t.size)
    phase = np.cumsum(f) / SR
    pulses = (np.diff(np.floor(phase), prepend=0) > 0).astype(float)
    pulses *= rng.uniform(0.5, 1.0, t.size)
    k = np.exp(-np.arange(int(0.006 * SR)) / (0.0012 * SR)) * np.sin(2 * np.pi * 900 * np.arange(int(0.006 * SR)) / SR)
    x = np.convolve(pulses, k, mode='same')
    x = fft_band(x, 80, bright)
    env = np.sin(np.pi * t / dur) ** 0.6
    return x / (np.abs(x).max() + 1e-9) * env


def breath(dur, depth=1.0):
    t = t_axis(dur)
    n = fft_band(rng.standard_normal(t.size), 150, 1400)
    n /= np.abs(n).max() + 1e-9
    inhale = np.clip(t / (dur * 0.45), 0, 1) ** 1.5 * (t < dur * 0.5)
    exhale = (t >= dur * 0.5) * np.exp(-(t - dur * 0.5) / (dur * 0.22))
    return depth * n * (0.6 * inhale + exhale) * 0.8


def place(track, clip, at, gain=1.0):
    i = int(at * SR)
    j = min(track.size, i + clip.size)
    track[i:j] += gain * clip[: j - i]


def write(path, mono_or_stereo, peak=0.89):
    x = np.atleast_2d(mono_or_stereo)
    if x.shape[0] == 1:
        x = np.vstack([x, x])
    x = x / (np.abs(x).max() + 1e-9) * peak
    data = (x.T * 32767).astype('<i2').tobytes()
    with wave.open(path, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data)


def stereo(x, spread=0.9):
    """Cheap stereo width: slightly delayed, filtered copy on the right."""
    d = int(0.011 * SR)
    r = np.concatenate([np.zeros(d), x[:-d]])
    return np.vstack([x, spread * x + (1 - spread) * r])


def ambience(out):
    """64 s seamless loop: wind in the trees over a very low drone."""
    L, X = 64.0, 4.0
    total = L + X
    w = wind(total, 120, 1100, gust_rate=1 / 16)
    w2 = wind(total, 300, 2200, gust_rate=1 / 23) * 0.35
    d = drone(total, 55.0) * 0.22
    mix = 0.75 * w + w2 + d
    # distant creaking branches, very quiet
    for at in [9.5, 31.0, 50.5]:
        place(mix, creak(1.8, 40, 110, 900), at, 0.12)
    # seamless loop: crossfade the extra tail over the head
    n, xn = int(L * SR), int(X * SR)
    fade = np.linspace(0, 1, xn)
    head = mix[:n].copy()
    head[:xn] = head[:xn] * fade + mix[n : n + xn] * (1 - fade)
    write(out, stereo(head))


def intro(out):
    """44 s opening film: steps on leaves, birdsong that stops, silence, two knocks, a hinge."""
    T = 44.5
    track = np.zeros(int(T * SR))
    # wind, falling away before the door
    w = wind(T, 150, 1000, 1 / 11) * smooth_env(int(T * SR), [(0, 0.0), (1.5, 0.30), (20, 0.26), (25, 0.04), (31, 0.0), (44.5, 0.0)])
    track += w
    # birds until ~8.5 s, then nothing
    t = 0.4
    while t < 8.2:
        f = rng.uniform(2600, 4200)
        for k in range(rng.integers(2, 5)):
            place(track, chirp(f, f * rng.uniform(1.2, 1.6), rng.uniform(0.05, 0.11)), t + k * 0.13, 0.08 * (1 - t / 9))
        t += rng.uniform(0.6, 1.4)
    # footsteps: steady, slowing near the cottage, stopping at the door
    t, gap = 0.3, 0.62
    while t < 24.0:
        place(track, leaf_step(rng.uniform(0.8, 1.0)), t, 0.55)
        if t > 15:
            gap = min(0.95, gap + 0.025)
        t += gap * rng.uniform(0.95, 1.05)
    # two knocks, with a gap
    place(track, knock(), 32.6, 0.9)
    place(track, knock(), 33.7, 0.85)
    # the hinge's long complaint
    place(track, creak(6.6, 70, 260, 3200), 36.4, 0.5)
    place(track, creak(4.0, 45, 120, 1200), 38.8, 0.25)
    # near-silent room tone so the "silence" is not digital zero
    track += 0.004 * fft_band(rng.standard_normal(track.size), 80, 600)
    write(out, stereo(track), peak=0.8)


def video2(out):
    """10 s: wind through the open window, faint crackle, then silence."""
    T = 10.0
    n = int(T * SR)
    track = wind(T, 200, 1600, 1 / 5) * smooth_env(n, [(0, 0.0), (0.4, 0.55), (5.5, 0.45), (7.6, 0.2), (8.0, 0.0), (T, 0.0)])
    crack = np.zeros(n)
    hits = rng.integers(0, int(4.2 * SR), 260)
    crack[hits] = rng.uniform(-1, 1, hits.size) ** 3
    crack = fft_band(crack, 1200, 7000)
    crack /= np.abs(crack).max() + 1e-9
    track += 0.22 * crack * smooth_env(n, [(0, 1), (3.5, 0.6), (4.5, 0.0), (T, 0)])
    track += 0.003 * fft_band(rng.standard_normal(n), 80, 600)
    write(out, stereo(track), peak=0.75)


def voice_bed(out):
    """Creaks and breathing that sit under the bedroom voice (22 s)."""
    T = 22.0
    track = np.zeros(int(T * SR))
    place(track, creak(2.6, 35, 95, 900), 0.6, 0.9)  # heavy bed timbers
    place(track, breath(2.6, 1.0), 6.6, 0.55)  # one slow breath, too deep
    place(track, creak(1.9, 30, 80, 700), 16.4, 0.8)  # something shifts its weight
    place(track, breath(3.0, 0.7), 18.0, 0.35)
    track += 0.006 * fft_band(rng.standard_normal(track.size), 60, 500)
    write(out, stereo(track, 0.95), peak=0.7)


def seamless(mix, L, X):
    """Crossfade the extra tail over the head so the clip loops without a seam."""
    n, xn = int(L * SR), int(X * SR)
    fade = np.linspace(0, 1, xn)
    head = mix[:n].copy()
    head[:xn] = head[:xn] * fade + mix[n : n + xn] * (1 - fade)
    return head


def kitchen(out):
    """32 s loop: a held-breath room, a clock ticking very softly, the house settling."""
    L, X = 32.0, 2.0
    n = int((L + X) * SR)
    track = 0.05 * fft_band(rng.standard_normal(n), 60, 400)
    t = np.arange(int(0.05 * SR)) / SR
    for k in range(int(L + X)):
        f = 2400 if k % 2 else 1900  # tick, tock
        click = np.sin(2 * np.pi * f * t) * np.exp(-t * 180) + 0.4 * np.sin(2 * np.pi * 600 * t) * np.exp(-t * 90)
        place(track, click, k + 0.2, 0.09)
    for at in [7.3, 21.8]:
        place(track, creak(0.9, 30, 70, 600), at, 0.12)
    write(out, stereo(seamless(track, L, X), 0.97), peak=0.5)


def bedroom(out):
    """30 s loop: slow breathing, too deep and too even, over a low drone."""
    L, X = 30.0, 3.0
    n = int((L + X) * SR)
    track = 0.04 * fft_band(rng.standard_normal(n), 50, 350)
    track += 0.12 * drone(L + X, 41.2)
    at = 0.3
    while at < L + X - 5:
        b = breath(4.6, 1.0)
        b = fft_band(b, 90, 900)  # darker than a small woman's breath
        place(track, b, at, 0.6)
        at += 5.8
    write(out, stereo(seamless(track, L, X), 0.95), peak=0.75)


def night(out):
    """40 s loop: open wind at the forest edge."""
    L, X = 40.0, 4.0
    w = wind(L + X, 250, 2600, gust_rate=1 / 9) + 0.5 * wind(L + X, 90, 500, gust_rate=1 / 14)
    write(out, stereo(seamless(w, L, X)), peak=0.85)


def latch(out):
    """Three blows on a swollen window latch; on the third the wood gives."""
    T = 3.6
    track = np.zeros(int(T * SR))
    t = t_axis(0.5)

    def blow(heavy):
        body = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t * d) for f, a, d in [(95, 1.0, 18), (180, 0.6, 26), (330, 0.3, 40)])
        slap = fft_band(rng.standard_normal(t.size) * np.exp(-t * 120), 300, 3500)
        rattle = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * 35) for f in (2480, 3710, 5150)) * 0.12
        x = body + 0.5 * slap / (np.abs(slap).max() + 1e-9) + rattle
        return x * (1.25 if heavy else 1.0)

    place(track, blow(False), 0.25)
    place(track, blow(False), 1.05)
    place(track, blow(True), 2.05)
    # the swollen wood gives: a dry crack and a short complaint
    crack = fft_band(rng.standard_normal(int(0.25 * SR)) * np.exp(-t_axis(0.25) * 30), 700, 5000)
    place(track, crack / (np.abs(crack).max() + 1e-9), 2.12, 0.7)
    place(track, creak(0.7, 90, 260, 2600), 2.25, 0.35)
    write(out, stereo(track, 0.95), peak=0.85)


def rise(out):
    """What rose from the bed: a low swell and the bed timbers groaning, cut off."""
    T = 3.2
    n = int(T * SR)
    t = t_axis(T)
    f = 38 + 14 * (t / T) ** 2
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * smooth_env(n, [(0, 0), (2.4, 1), (2.75, 1), (2.8, 0), (T, 0)])
    track = 0.9 * sub
    place(track, creak(2.2, 30, 90, 900), 0.4, 0.55)
    write(out, stereo(track, 0.95), peak=0.85)


def glass(out):
    """The lamp thrown: glass bursting on the boards, then oil catching with a soft rush."""
    T = 3.0
    n = int(T * SR)
    track = np.zeros(n)
    burst = fft_band(rng.standard_normal(int(0.4 * SR)) * np.exp(-t_axis(0.4) * 14), 2000, 12000)
    place(track, burst / (np.abs(burst).max() + 1e-9), 0.1, 0.8)
    for _ in range(40):  # shards ringing as they scatter
        d = rng.uniform(0.04, 0.12)
        tt = t_axis(d)
        ping = np.sin(2 * np.pi * rng.uniform(3000, 9000) * tt) * np.exp(-tt * rng.uniform(40, 90))
        place(track, ping, 0.1 + rng.uniform(0, 0.9), rng.uniform(0.05, 0.2))
    place(track, knock(), 0.1, 0.5)
    rush = fft_band(rng.standard_normal(n), 80, 900) * smooth_env(n, [(0, 0), (0.5, 0), (0.9, 0.7), (1.6, 0.35), (T, 0.15)])
    track += 0.6 * rush / (np.abs(rush).max() + 1e-9)
    crack = np.zeros(n)
    hits = rng.integers(int(0.8 * SR), n, 200)
    crack[hits] = rng.uniform(-1, 1, hits.size) ** 3
    track += 0.25 * fft_band(crack, 1500, 7000)
    write(out, stereo(track), peak=0.9)


def tear(out):
    """Cloth ripping as she goes through the window, then the fall into wet grass."""
    T = 2.2
    track = np.zeros(int(T * SR))
    d = 0.7
    tt = t_axis(d)
    rip = fft_band(rng.standard_normal(tt.size), 900, 6500) * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 38 * tt))) * smooth_env(tt.size, [(0, 0), (0.05, 1), (0.6, 0.8), (d, 0)])
    place(track, rip / (np.abs(rip).max() + 1e-9), 0.1, 0.8)
    t2 = t_axis(0.5)
    thud = np.sin(2 * np.pi * 60 * t2) * np.exp(-t2 * 14) + 0.4 * fft_band(rng.standard_normal(t2.size) * np.exp(-t2 * 20), 200, 2500)
    place(track, thud, 1.05, 0.9)
    place(track, fft_band(rng.standard_normal(int(0.6 * SR)) * np.exp(-t_axis(0.6) * 6), 2000, 8000), 1.1, 0.12)  # wet grass
    write(out, stereo(track), peak=0.85)


def run(out):
    """Running hurt: heartbeat, ragged breath, uneven steps, the hood snagging in the brambles."""
    T = 7.5
    n = int(T * SR)
    track = np.zeros(n)
    tb = t_axis(0.12)
    beat = np.sin(2 * np.pi * 48 * tb) * np.exp(-tb * 30)
    at = 0.1
    while at < T - 0.5:
        place(track, beat, at, 0.9)
        place(track, beat, at + 0.18, 0.6)
        at += 0.52
    at = 0.3
    while at < T - 1:
        place(track, breath(0.9, 0.9), at, 0.35)
        at += rng.uniform(0.85, 1.1)
    at, k = 0.2, 0
    while at < T - 0.8:
        place(track, leaf_step(0.9 if k % 2 else 0.55), at, 0.45)  # the hurt leg lands lighter
        at += 0.33 if k % 2 else 0.45
        k += 1
    snag = fft_band(rng.standard_normal(int(0.35 * SR)), 1200, 7000) * smooth_env(int(0.35 * SR), [(0, 0), (0.02, 1), (0.3, 0.6), (0.35, 0)])
    place(track, snag / (np.abs(snag).max() + 1e-9), 4.6, 0.5)
    track *= smooth_env(n, [(0, 1), (T - 1.5, 1), (T, 0)])
    write(out, stereo(track), peak=0.85)


if __name__ == '__main__':
    d = sys.argv[1]
    ambience(f'{d}/ambience.wav')
    intro(f'{d}/intro-audio.wav')
    video2(f'{d}/story-2-audio.wav')
    voice_bed(f'{d}/voice-bed.wav')
    kitchen(f'{d}/kitchen.wav')
    bedroom(f'{d}/bedroom.wav')
    night(f'{d}/night.wav')
    latch(f'{d}/latch.wav')
    for fx in (rise, glass, tear, run):
        fx(f'{d}/{fx.__name__}.wav')
    print('audio done')
