"""
Builds the voice sounds from the author's own recordings.

Usage:  python3 tools/media/author_voice.py <recordings_dir> <out_dir>

<recordings_dir> holds 44.1 kHz mono WAVs (convert phone recordings with
ffmpeg first):
  lines.wav   "Is that you, child?" … "Come in, come in. Shut the door behind you, there's a draught."
  call.wav    the drawn-out "Child…?" for the end of the story
  breath.wav  slow, deep breaths
Times below locate the parts of each recording; adjust them for new takes.

Writes to <out_dir>: grandmother-voice.wav (the "Listen at the door" clip),
bedroom.wav (the breathing loop for the bedroom scene) and child-call.wav.
The raw recordings are not kept in the repository.
"""
import os
import subprocess
import sys
import tempfile
import wave

import numpy as np

sys.path.insert(0, os.path.dirname(__file__))
from audio import SR, creak, drone, fft_band, place, rng, smooth_env, stereo, write  # noqa: E402

LINE1 = (2.7, 4.65)  # "Is that you, child?"
LINE2 = (6.9, 13.05)  # "Come in, come in. Shut the door behind you, there's a draught."
CALL = (3.5, 5.8)  # "Chi-i-ild…?"
BREATHS = [(4.1, 5.4), (9.5, 11.5), (12.3, 13.9), (14.7, 16.9)]


def ffmpeg(src, dst, af):
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', src, '-af', af, '-ac', '1', '-ar', str(SR), dst], check=True)


def load(path, span=None):
    with wave.open(path) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), '<i2').astype(float) / 32768
    if span:
        x = x[int(span[0] * SR) : int(span[1] * SR)]
    # soft edges so cut-outs never click
    n = min(len(x) // 4, int(0.04 * SR))
    x[:n] *= np.linspace(0, 1, n)
    x[-n:] *= np.linspace(1, 0, n)
    return x


def pitch(semitones):
    """ffmpeg filter: shift pitch, keep duration."""
    r = 2 ** (semitones / 12)
    return f'asetrate={SR}*{r:.4f},aresample={SR},atempo={1 / r:.4f}'


def main(src, out):
    tmp = tempfile.mkdtemp()
    # the voice: a little lower, close room, gently levelled
    ffmpeg(
        f'{src}/lines.wav',
        f'{tmp}/lines.wav',
        f'highpass=f=80,afftdn=nf=-60,{pitch(-1.5)},acompressor=threshold=-24dB:ratio=3:attack=5:release=120,'
        'aecho=0.8:0.5:24|41:0.18|0.1',
    )
    # the breath: lower still, so it is too deep for her
    ffmpeg(f'{src}/breath.wav', f'{tmp}/breath.wav', f'highpass=f=60,afftdn=nf=-60,{pitch(-4)},lowpass=f=1800')
    # the call: far away among the trees
    ffmpeg(
        f'{src}/call.wav',
        f'{tmp}/call.wav',
        f'highpass=f=150,afftdn=nf=-60,{pitch(-1)},lowpass=f=2600,aecho=0.8:0.7:110|240|410:0.35|0.25|0.15',
    )

    line1 = load(f'{tmp}/lines.wav', LINE1)
    line2 = load(f'{tmp}/lines.wav', LINE2)
    breaths = [load(f'{tmp}/breath.wav', b) for b in BREATHS]
    breaths = [b / (np.abs(b).max() + 1e-9) for b in breaths]
    voice_peak = max(np.abs(line1).max(), np.abs(line2).max())
    line1, line2 = line1 / voice_peak, line2 / voice_peak

    # 1. "Listen at the door": creak, line 1, one breath too deep, line 2, the bed shifts
    t2 = 3.9 + len(line1) / SR + 2.0
    end = t2 + len(line2) / SR
    total = end + 6.5
    clip = np.zeros(int(total * SR))
    place(clip, creak(2.6, 35, 95, 900), 0.6, 0.55)
    place(clip, line1, 3.9, 0.9)
    place(clip, breaths[3], 3.9 + len(line1) / SR + 0.35, 0.45)
    place(clip, line2, t2, 0.9)
    place(clip, creak(1.9, 30, 80, 700), end + 0.4, 0.5)
    place(clip, breaths[1], end + 1.6, 0.35)
    place(clip, breaths[2], end + 3.8, 0.3)
    clip += 0.004 * fft_band(rng.standard_normal(clip.size), 60, 500)
    clip *= smooth_env(clip.size, [(0, 1), (total - 1.2, 1), (total, 0)])
    write(f'{out}/grandmother-voice.wav', stereo(clip, 0.95), peak=0.85)

    # 2. the bedroom loop: her breathing, slow and even, over a low drone
    L, X = 30.0, 3.0
    n = int((L + X) * SR)
    room = 0.04 * fft_band(rng.standard_normal(n), 50, 350) + 0.12 * drone(L + X, 41.2)
    at, k = 0.4, 0
    while at < L + X - 3:
        place(room, breaths[k % len(breaths)], at, 0.6)
        at += 5.8
        k += 1
    xn = int(X * SR)
    head = room[: int(L * SR)].copy()
    head[:xn] = head[:xn] * np.linspace(0, 1, xn) + room[int(L * SR) : int(L * SR) + xn] * np.linspace(1, 0, xn)
    write(f'{out}/bedroom.wav', stereo(head, 0.95), peak=0.75)

    # 3. the call
    call = load(f'{tmp}/call.wav', (CALL[0], CALL[1] + 1.5))
    padded = np.concatenate([np.zeros(int(0.4 * SR)), call, np.zeros(int(2.5 * SR))])
    write(f'{out}/child-call.wav', stereo(padded, 0.9), peak=0.7)
    print('author voice done')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
