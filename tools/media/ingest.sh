#!/usr/bin/env bash
# Turns the author's own AI-generated media (e.g. Adobe Firefly) into the
# site's files, keeping the synthesised soundtrack timed to the brief.
#
# Usage: bash tools/media/ingest.sh <folder>
# The folder may contain any of these (anything missing is left as it is):
#   shot1.*  forest path            → 0:00–0:08 of the opening film
#   shot2.*  branch across the path → 0:08–0:16 (optional; shot1 continues if missing)
#   shot3.*  the cottage            → 0:16–0:24
#   shot5.*  hand knocks twice      → 0:24–0:36 (its first frame is held as the door shot)
#   shot6.*  door swings open       → 0:36–0:44, then black
#   room.*   Video 2                → 0:00–0:08, then black to 0:10
#   illustration-1.* / illustration-2.*  (png, jpg or webp)
# Clips of any length/size work: each is cropped to 16:9 and slowed or
# trimmed to fill its slot. Any audio in the clips is discarded.
set -euo pipefail
IN=$(cd "$1" && pwd)
cd "$(dirname "$0")/../.."
OUT=public/media
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
find1() { find "$IN" -maxdepth 1 -iname "$1.*" | head -1; }
dur() { ffprobe -v error -show_entries format=duration -of csv=p=0 "$1"; }
VF='scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,fps=24,format=yuv420p'

# fit a clip to exactly $2 seconds: slow it down if short, trim if long
fit() {
  local src=$1 len=$2 dst=$3 d
  d=$(dur "$src")
  local f
  f=$(python3 -c "print(max(1.0, $len / $d))")
  ffmpeg -loglevel error -y -i "$src" -an -vf "setpts=$f*PTS,$VF" -t "$len" -c:v libx264 -crf 20 -preset fast "$dst"
}
hold_first() { # hold a clip's first frame for $2 seconds
  ffmpeg -loglevel error -y -i "$1" -frames:v 1 "$TMP/still.png"
  ffmpeg -loglevel error -y -loop 1 -i "$TMP/still.png" -vf "$VF" -t "$2" -c:v libx264 -crf 20 -preset fast "$3"
}
black() { ffmpeg -loglevel error -y -f lavfi -i "color=c=black:s=1280x720:r=24" -t "$1" -pix_fmt yuv420p -c:v libx264 "$2"; }
# join clips with short dips to black between them, plus a soft vignette to match the site
join() {
  local out=$1; shift
  local list="$TMP/list.txt"; : > "$list"
  for c in "$@"; do
    ffmpeg -loglevel error -y -i "$c" -vf "fade=t=in:st=0:d=0.4,fade=t=out:st=$(python3 -c "print($(dur "$c") - 0.4)"):d=0.4" -c:v libx264 -crf 20 -preset fast "$c.f.mp4"
    echo "file '$c.f.mp4'" >> "$list"
  done
  ffmpeg -loglevel error -y -f concat -safe 0 -i "$list" -vf "vignette=PI/5" -c:v libx264 -crf 25 -preset slow -maxrate 2.5M -bufsize 5M -pix_fmt yuv420p "$out"
}
mux() { ffmpeg -loglevel error -y -i "$1" -i "$2" -map 0:v -map 1:a -c:v copy -c:a aac -ar 48000 -b:a 128k -shortest -movflags +faststart "$3"; }

python3 tools/media/audio.py "$TMP" > /dev/null

S1=$(find1 shot1); S2=$(find1 shot2); S3=$(find1 shot3); S5=$(find1 shot5); S6=$(find1 shot6)
if [[ -n "$S1" && -n "$S3" && -n "$S5" && -n "$S6" ]]; then
  echo "· opening film"
  if [[ -n "$S2" ]]; then fit "$S1" 8 "$TMP/a.mp4"; fit "$S2" 8 "$TMP/b.mp4"; else fit "$S1" 16 "$TMP/a.mp4"; fi
  fit "$S3" 8 "$TMP/c.mp4"
  hold_first "$S5" 8 "$TMP/d.mp4"
  fit "$S5" 4 "$TMP/e.mp4"
  fit "$S6" 8 "$TMP/f.mp4"
  black 0.5 "$TMP/g.mp4"
  parts=("$TMP/a.mp4"); [[ -n "$S2" ]] && parts+=("$TMP/b.mp4")
  join "$TMP/intro-v.mp4" "${parts[@]}" "$TMP/c.mp4" "$TMP/d.mp4" "$TMP/e.mp4" "$TMP/f.mp4" "$TMP/g.mp4"
  mux "$TMP/intro-v.mp4" "$TMP/intro-audio.wav" $OUT/video/intro.mp4
  ffmpeg -loglevel error -y -ss 1.5 -i $OUT/video/intro.mp4 -frames:v 1 "$TMP/p.png"
  python3 -c "from PIL import Image; Image.open('$TMP/p.png').save('$OUT/images/intro-poster.webp', quality=80)"
else
  echo "· opening film: needs shot1, shot3, shot5 and shot6 — skipped"
fi

R=$(find1 room)
if [[ -n "$R" ]]; then
  echo "· Video 2"
  fit "$R" 8 "$TMP/r.mp4"; black 2 "$TMP/rb.mp4"
  join "$TMP/room-v.mp4" "$TMP/r.mp4" "$TMP/rb.mp4"
  mux "$TMP/room-v.mp4" "$TMP/story-2-audio.wav" $OUT/video/story-2.mp4
  ffmpeg -loglevel error -y -ss 1.0 -i $OUT/video/story-2.mp4 -frames:v 1 "$TMP/p2.png"
  python3 -c "from PIL import Image; Image.open('$TMP/p2.png').save('$OUT/images/story-2-poster.webp', quality=80)"
fi

python3 - "$IN" "$OUT/images" <<'PY'
import glob, sys
from PIL import Image, ImageOps
src, out = sys.argv[1:]
for name, ratio, size in [('illustration-1', 3 / 2, (1800, 1200)), ('illustration-2', 4 / 5, (1280, 1600))]:
    files = [f for f in glob.glob(f'{src}/{name}.*') if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp'))]
    if not files:
        continue
    im = Image.open(files[0]).convert('RGB')
    im = ImageOps.fit(im, size, Image.LANCZOS, centering=(0.5, 0.5)) if abs(im.width / im.height - ratio) > 0.01 else im.resize(size, Image.LANCZOS) if im.width > size[0] else im
    q = 82
    while True:
        im.save(f'{out}/{name}.webp', 'WEBP', quality=q, method=6)
        import os
        if os.path.getsize(f'{out}/{name}.webp') < 400_000 or q <= 60:
            break
        q -= 6
    print(f'· {name}: {im.width}x{im.height}, quality {q}')
PY
ls -la $OUT/video $OUT/images
