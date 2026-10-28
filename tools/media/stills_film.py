"""
Cuts the opening film from four still images, timed to the synthesised
soundtrack: slow camera moves, dissolves, a small jolt at each knock.

Usage:  python3 tools/media/stills_film.py <path.png> <cottage.png> <door.png> <door-open.png> <out.mp4>
Writes a silent H.264 video (44.5 s, 1280x720, 30 fps) and <out>-poster.png.
"""
import math
import subprocess
import sys

import numpy as np
from PIL import Image

W, H, FPS, T = 1280, 720, 30, 44.5


def smooth(e0, e1, x):
    t = min(1.0, max(0.0, (x - e0) / (e1 - e0)))
    return t * t * (3 - 2 * t)


def view(im, zoom, cx, cy, dx=0.0, dy=0.0):
    """Crop a 16:9 window (1/zoom of the picture) centred near (cx, cy), resized to the frame."""
    iw, ih = im.size
    w = iw / zoom
    h = w * H / W
    if h > ih / zoom:
        h = ih / zoom
        w = h * W / H
    x0 = min(max(cx * iw - w / 2 + dx, 0), iw - w)
    y0 = min(max(cy * ih - h / 2 + dy, 0), ih - h)
    return np.asarray(im.resize((W, H), Image.BICUBIC, box=(x0, y0, x0 + w, y0 + h)), dtype=np.float32)


def lin(t, t0, t1):
    return min(1.0, max(0.0, (t - t0) / (t1 - t0)))


def float_(t, amp):
    """A slow steadicam float: two low, unrelated frequencies, never a shake."""
    return amp * math.sin(2 * math.pi * 0.11 * t), amp * 0.6 * math.sin(2 * math.pi * 0.07 * t + 1.3)


def shot_path(t, im):
    # constant, unhurried push down the path towards the light
    fx, fy = float_(t, 5)
    return view(im, 1.08 + 0.32 * lin(t, 0, 16.8), 0.52, 0.5 - 0.03 * lin(t, 0, 16.8), fx, fy)


def shot_cottage(t, im):
    fx, fy = float_(t, 4)
    return view(im, 1.06 + 0.26 * lin(t, 15.6, 24.6), 0.5, 0.58 + 0.03 * lin(t, 15.6, 24.6), fx, fy)


def door_move(t):
    # slow at the door, then drawn ever faster into the dark (one continuous curve)
    k = lin(t, 23.4, 44.2) ** 2.2
    return 1.06 + 0.4 * k, 0.5 + 0.05 * k


def shot_door(t, im):
    z, cx = door_move(t)
    fx, fy = float_(t, 2.5)
    knock = sum(math.exp(-((t - k) * 10) ** 2) * 2.5 for k in (32.6, 33.7))  # the frame starts at each knock
    return view(im, z, cx, 0.5, fx, fy + knock)


def mix(a, b, k):
    return a if k <= 0 else b if k >= 1 else a * (1 - k) + b * k


def frame(t, path, cottage, door, opened):
    # each shot keeps moving through its dissolve, so motion never stops
    if t < 15.6:
        a = shot_path(t, path)
    elif t < 16.8:
        a = mix(shot_path(t, path), shot_cottage(t, cottage), smooth(15.6, 16.8, t))
    elif t < 23.4:
        a = shot_cottage(t, cottage)
    elif t < 24.6:
        a = mix(shot_cottage(t, cottage), shot_door(t, door), smooth(23.4, 24.6, t))
    elif t < 36.4:
        a = shot_door(t, door)
    else:
        # the door gives way to the dark
        a = mix(shot_door(t, door), shot_door(t, opened), smooth(36.4, 40.0, t))
    a = a * np.array([0.94, 0.97, 1.03], dtype=np.float32)  # cold grade
    fade = min(smooth(0, 1.5, t), 1 - smooth(43.2, 44.2, t))
    return np.clip(a * VIGNETTE * fade, 0, 255).astype(np.uint8)


yy, xx = np.mgrid[0:H, 0:W]
r = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2)
VIGNETTE = (1 - 0.45 * np.clip((r - 0.55) / 0.85, 0, 1) ** 1.6)[..., None].astype(np.float32)

if __name__ == '__main__':
    *srcs, out = sys.argv[1:]
    ims = [Image.open(s).convert('RGB') for s in srcs]
    ff = subprocess.Popen(
        ['ffmpeg', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
         '-vf', 'noise=alls=4:allf=t', '-c:v', 'libx264', '-preset', 'slow', '-tune', 'film', '-crf', '24', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out],
        stdin=subprocess.PIPE,
    )
    for i in range(int(T * FPS)):
        t = i / FPS
        f = frame(t, *ims)
        ff.stdin.write(f.tobytes())
        if i == int(2.5 * FPS):
            Image.fromarray(f).save(out.replace('.mp4', '-poster.png'))
    ff.stdin.close()
    ff.wait()
    print('film done')
