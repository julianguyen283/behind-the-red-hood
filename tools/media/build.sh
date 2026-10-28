#!/usr/bin/env bash
# Rebuilds every media file in public/media from the code in this folder.
# Needs: python3 + numpy + Pillow, Node + Playwright (with Chromium), ffmpeg,
# and Festival with the CMU SLT voice (apt install festival festvox-us-slt-hts).
# Usage: bash tools/media/build.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
TMP=$(mktemp -d)
OUT=public/media
mkdir -p $OUT/video $OUT/images $OUT/audio

echo "· sound"
python3 tools/media/audio.py "$TMP"

echo "· voice (Festival TTS stand-in: re-record with your own voice if you can)"
echo "Is that you, child?" | text2wave -eval "(voice_cmu_us_slt_arctic_hts)" -o "$TMP/l1.wav"
echo "Come in, come in. Shut the door behind you. There's a draught." | text2wave -eval "(voice_cmu_us_slt_arctic_hts)" -o "$TMP/l2.wav"
VOICE_FX="aresample=44100,asetrate=44100*0.9,aresample=44100,atempo=0.95,highpass=f=90,lowpass=f=5200,equalizer=f=220:t=q:w=1:g=3,aecho=0.8:0.55:28|47:0.22|0.12"
for f in l1 l2; do ffmpeg -loglevel error -y -i "$TMP/$f.wav" -af "$VOICE_FX" -ac 2 "$TMP/${f}p.wav"; done
ffmpeg -loglevel error -y -i "$TMP/voice-bed.wav" -i "$TMP/l1p.wav" -i "$TMP/l2p.wav" \
  -filter_complex "[1]adelay=3900|3900[a];[2]adelay=10200|10200[b];[0][a][b]amix=inputs=3:normalize=0,afade=t=out:st=20.5:d=1.5,loudnorm=I=-16:TP=-1.5:LRA=11" \
  -ar 44100 -b:a 192k $OUT/audio/grandmother-voice.mp3
ffmpeg -loglevel error -y -i "$TMP/ambience.wav" -af "loudnorm=I=-18:TP=-2" -ar 44100 -b:a 128k $OUT/audio/ambience.mp3
# scene loops for the soundscape (the kitchen sits quieter on purpose)
ffmpeg -loglevel error -y -i "$TMP/kitchen.wav" -af "loudnorm=I=-26:TP=-3" -ar 44100 -b:a 96k $OUT/audio/kitchen.mp3
ffmpeg -loglevel error -y -i "$TMP/bedroom.wav" -af "loudnorm=I=-20:TP=-2" -ar 44100 -b:a 96k $OUT/audio/bedroom.mp3
ffmpeg -loglevel error -y -i "$TMP/night.wav" -af "loudnorm=I=-19:TP=-2" -ar 44100 -b:a 96k $OUT/audio/night.mp3
# the faint call after the last line (stand-in until the author's recording is cut in)
echo "Child?" | text2wave -eval "(voice_cmu_us_slt_arctic_hts)" -o "$TMP/call.wav"
ffmpeg -loglevel error -y -i "$TMP/call.wav" -af "adelay=600|600,aresample=44100,asetrate=44100*0.86,aresample=44100,atempo=0.85,lowpass=f=2600,highpass=f=150,aecho=0.8:0.7:120|260|420:0.35|0.25|0.15,apad=pad_dur=3,loudnorm=I=-22:TP=-3" -ac 2 -ar 44100 -b:a 128k $OUT/audio/child-call.mp3

echo "· pictures and films (headless Chromium)"
node tools/media/render.cjs "$TMP" all

mux() { ffmpeg -loglevel error -y -i "$1" -i "$2" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 128k -af "loudnorm=I=-18:TP=-1.5" -ar 48000 -shortest -movflags +faststart "$3"; }
mux "$TMP/intro-video.mp4" "$TMP/intro-audio.wav" $OUT/video/intro.mp4
mux "$TMP/story-2-video.mp4" "$TMP/story-2-audio.wav" $OUT/video/story-2.mp4

python3 - "$TMP" "$OUT/images" <<'PY'
import sys
from PIL import Image
tmp, out = sys.argv[1:]
def save(src, dst, size=None, q=78):
    im = Image.open(f'{tmp}/{src}').convert('RGB')
    if size: im.thumbnail(size, Image.LANCZOS)
    im.save(f'{out}/{dst}', 'WEBP', quality=q, method=6)
save('illustration-1.png', 'illustration-1.webp', (1800, 1200))
save('illustration-2.png', 'illustration-2.webp', (1280, 1600))
save('intro-video-poster.png', 'intro-poster.webp')
save('story-2-video-poster.png', 'story-2-poster.webp')
PY
rm -rf "$TMP"
ls -la $OUT/video $OUT/images $OUT/audio
