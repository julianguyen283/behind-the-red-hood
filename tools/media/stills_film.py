"""
Cuts the opening film from four still images, timed to the synthesised
soundtrack: slow camera moves, dissolves, a small jolt at each knock.

Usage:  python3 tools/media/stills_film.py <path.png> <cottage.png> <door.png> <door-open.png> <out.mp4>
Writes a silent H.264 video (44.5 s, 1280x720, 24 fps) and <out>-poster.png.
"""
import math
import subprocess
import sys

import numpy as np
from PIL import Image

W, H, FPS, T = 1280, 720, 24, 44.5


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


def frame(t, path, cottage, door, opened):
    if t < 16.6:
        # the walk: a slow push down the path, a faint bob with each step
        bob = 2.2 * math.sin(2 * math.pi * t / 0.62)
        sway = 1.6 * math.sin(math.pi * t / 0.62)
        a = view(path, 1.0 + 0.32 * smooth(0, 16.6, t), 0.52, 0.5, sway, bob)
        if t > 15.4:  # dissolve to the cottage
            b = view(cottage, 1.0, 0.5, 0.56)
            k = smooth(15.4, 16.6, t)
            a = a * (1 - k) + b * k
    elif t < 24:
        a = view(cottage, 1.0 + 0.28 * smooth(16.6, 24, t), 0.5, 0.56)
    elif t < 36.4:
        # at the door: almost still; the frame jolts a little at each knock
        jolt = sum(math.exp(-((t - k) * 14) ** 2) * 4 for k in (32.6, 33.7))
        drift = 1.0 * math.sin(t * 0.8)
        a = view(door, 1.04 + 0.04 * smooth(24, 36, t), 0.5, 0.5, drift, jolt)
    else:
        # the door gives way to the dark: dissolve, then a slow push into it
        z = 1.06 + 0.3 * smooth(37.5, 44, t)
        closed = view(door, z, 0.5 + 0.06 * smooth(37.5, 44, t), 0.5)
        dark = view(opened, z, 0.5 + 0.06 * smooth(37.5, 44, t), 0.5)
        k = smooth(36.4, 39.6, t)
        a = closed * (1 - k) + dark * k
    # cold grade, vignette, fades
    a = a * np.array([0.94, 0.97, 1.03], dtype=np.float32)
    fade = min(smooth(0, 1.4, t), 1 - smooth(43.2, 44.0, t))
    dip = 1 - 0.85 * math.exp(-((t - 24) / 0.25) ** 2)  # a brief dip at the cut to the door
    return np.clip(a * VIGNETTE * fade * dip, 0, 255).astype(np.uint8)


yy, xx = np.mgrid[0:H, 0:W]
r = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2)
VIGNETTE = (1 - 0.45 * np.clip((r - 0.55) / 0.85, 0, 1) ** 1.6)[..., None].astype(np.float32)

if __name__ == '__main__':
    *srcs, out = sys.argv[1:]
    ims = [Image.open(s).convert('RGB') for s in srcs]
    ff = subprocess.Popen(
        ['ffmpeg', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
         '-vf', 'noise=alls=5:allf=t', '-c:v', 'libx264', '-preset', 'slow', '-crf', '24', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out],
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
