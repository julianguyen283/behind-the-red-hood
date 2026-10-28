# Editing the website

You can do all of this in your web browser on github.com. No software is needed.

## The safe way: preview first, then publish

1. On GitHub, open the file you want to change (see the table below) and click the ✏️ **pencil** icon.
2. Make your change.
3. Click **Commit changes…** and choose **"Create a new branch for this commit and start a pull request"**. Give it a short name, such as `fix-ending`.
4. On the pull request page, wait about a minute. Vercel adds a comment with a **Preview** link: the full website with your change, not yet public.
5. Open the preview and check it on your phone too.
6. If it looks right, click **Merge pull request** and the public site updates within about a minute. If not, keep editing on the same branch; the preview updates each time.

**Quick fixes** (a typo, say): choose **"Commit directly to the main branch"** in step 3, and it publishes straight away.

If a change breaks the build, Vercel keeps the previous version online and marks the deployment ❌ **Failed**. The public site never goes blank. Open the failed deployment in Vercel to read the error, or undo the change.

## Text

| What | File | Notes |
|---|---|---|
| Story | `src/content/story.md` | One blank line between paragraphs. `*word*` makes italics. A line starting with `>` is set apart and centred. Straight quotes become curly quotes automatically. |
| Closing lines | `src/content/ending.md` | Same rules |
| Title, subtitle, your name, content note | `src/content/site.ts` | Change only the text inside the quotes `'…'` |
| The three lines over the opening film, and when they appear | `src/content/media.ts` → `textCues` | `start` and `end` are in seconds |
| Audio transcript | `src/content/media.ts` → `audio-1` → `transcript` | |
| Credits | `src/content/site.ts` → `credits` | Remove `pending: true` once an item is complete, and its red highlight disappears |

**Apostrophes in `site.ts` and `media.ts`:** the text there sits inside single quotes, so write `\'` (for example `'Grandmother\'s room'`), or use a curly apostrophe `’`. This doesn't apply to the `.md` story files.

## Images, video and audio

1. On GitHub, go to the right folder inside `public/media/` (`images`, `video`, `audio` or `captions`).
2. Click **Add file → Upload files**.
3. Upload with **exactly** the filename listed in `public/media/README.md`, for example `illustration-1.webp`. Uploading a file with the same name replaces the sample media that is there now.

The placeholder is replaced automatically. Then, in `src/content/media.ts`:

- write the **alt text** for each illustration (`alt: '…'`)
- add a **credit** line (`credit: '…'`) such as `'Image: [tool], generated 27 Oct 2026'`
- check the **audio transcript** matches your recording

**Size limits:** GitHub's web upload accepts files up to 25 MB. Compress large videos with HandBrake (free, "Fast 1080p30" preset) or <https://www.freeconvert.com/video-compressor>.

**Captions** are `.vtt` text files. Copy `public/media/captions/intro.vtt` as a pattern: each cue is a time range `00:00:05.000 --> 00:00:10.000` followed by its text.

**Moving media within the story:** in `story.md`, cut a marker line such as `[[image:image-1]]` and paste it between two other paragraphs, keeping a blank line on each side.

## Background sound

The **Sound on / Sound off** button plays `public/media/audio/ambience.mp3` on a loop.
- It plays at about **12%** volume.
- It drops to about **4%** while a video or the bedroom voice plays with sound, and comes back when they stop.
- It never starts by itself. Browsers only allow sound after a click, so a returning visitor who left sound on hears it again after their first click or keypress.

To change the levels, edit `LEVEL` and `DUCKED` at the top of `src/hooks/useAmbientSound.tsx`. These are fractions: `0.12` means 12%.

## The sample media

The opening film, Video 2, both illustrations, the sound effects and the ambience were generated in code. The scripts are in `tools/media/`, and `bash tools/media/build.sh` rebuilds all of them.

The bedroom voice is a **synthetic stand-in** (Festival speech synthesis). Your brief recommends recording it yourself. If you do, upload your recording as `public/media/audio/grandmother-voice.mp3` and update its credit in `src/content/site.ts`.

You can replace any sample by uploading your own file under the same name.

## Colours, fonts and layout

Everything is in `src/content/theme.css`, with a comment on each line:

- **Colours:** `--color-crimson`, `--color-void` (background), `--color-ivory` (text), the forest tones and the rest.
- **Story text size, line spacing, indent and column width:** `--story-size`, `--story-leading`, `--story-indent`, `--story-width`.

Changing a colour value, such as `#c53242`, updates it everywhere on the site.

For bigger layout changes, the section components are in `src/components/`:

| File | Section |
|---|---|
| `Hero.tsx` | Title screen |
| `IntroFilm.tsx` | Intro film |
| `Story.tsx` | The story |
| `Ending.tsx` | Closing section |
| `Credits.tsx` | Credits |

## Getting help from Claude later

Start a Claude Code session with the `behind-the-red-hood` repository selected, and describe the change, for example: *"Make the drop cap smaller and add Illustration 1's alt text"*. Ask it to open a pull request, so you get a preview link before anything goes live.
