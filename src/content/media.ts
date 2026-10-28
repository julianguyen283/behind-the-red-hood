/**
 * MEDIA CONFIGURATION
 * -------------------------------------------------------------------
 * Put files in /public/media/... at the paths below (or change the
 * paths). A missing file shows a clearly labelled placeholder instead,
 * so placeholder visuals are never presented as final media.
 */

export type ImageMedia = {
  kind: 'image'
  src: string
  /** optional separate crop for phones (shown below 768px wide) */
  srcMobile?: string
  alt: string
  caption?: string
  aspect: string // CSS aspect-ratio of the desktop image
  aspectMobile?: string
  placeholderNote: string
  /** true = readers can tap the image to see it full-screen */
  enlarge?: boolean
}

export type TextCue = { text: string; start: number; end: number }

export type VideoMedia = {
  kind: 'video'
  src: string
  poster?: string
  captions?: string // WebVTT file
  title: string // accessible name for the player
  aspect: string
  placeholderNote: string
  /** Lines of text shown over the video at set times (seconds). */
  textCues?: TextCue[]
  /** true = if the file is missing, hide it on the published site
   *  instead of showing a placeholder (placeholder still shows in dev). */
  optional?: boolean
}

export type AudioMedia = {
  kind: 'audio'
  src: string
  /** visible label next to the play button */
  label: string
  /** what a screen reader announces for the play button */
  buttonLabel: string
  /** Transcript, one entry per line. *Asterisks* make a line italic. */
  transcript: string[]
  placeholderNote: string
}

/** Opening film: the instructions Red carries into the forest; the door opens by itself. */
export const introVideo: VideoMedia = {
  kind: 'video',
  src: '/media/video/intro.mp4',
  poster: '/media/images/intro-poster.webp',
  captions: '/media/captions/intro.vtt',
  title: 'Opening film: the walk through the forest to the cottage door',
  aspect: '16 / 9',
  placeholderNote: 'Opening video (35–45 s, MP4 H.264 1920×1080, under 15 MB) → /public/media/video/intro.mp4',
  // Shown as sharp HTML text over the video, so it can be edited without re-exporting.
  textCues: [
    { text: 'Stay on the path.', start: 3, end: 25 },
    { text: 'Don’t keep her waiting.', start: 10, end: 25 },
    { text: 'Be a good girl.', start: 18, end: 25 },
  ],
}

/** Shot list shown inside the opening-film placeholder until the real film is added. */
export const introShotList = [
  ['0:00', 'Dusk path through pine forest, low mist; the basket at the bottom of the frame'],
  ['0:08', 'A branch across the path; the birdsong stops'],
  ['0:16', 'The cottage under three oaks; no smoke, dark windows'],
  ['0:24', 'At the wooden door; the footsteps stop; silence'],
  ['0:32', 'A hand knocks twice'],
  ['0:36', 'The door swings inward by itself onto darkness'],
  ['0:44', 'Cut to black'],
]

/**
 * Story media, placed in story.md with markers such as [[audio:audio-1]].
 *   audio-1 → after "Then a voice came from the bedroom."
 *   image-1 → after "Be a good girl and come and sit with me."
 *   video-2 → after Red falls into the wet grass of the yard
 *   image-2 → after the final line (in the Ending section)
 */
export const storyMedia: Record<string, ImageMedia | VideoMedia | AudioMedia> = {
  'audio-1': {
    kind: 'audio',
    src: '/media/audio/grandmother-voice.mp3',
    label: 'Listen at the door',
    buttonLabel: 'Play the voice from the bedroom',
    transcript: [
      '*(Silence. A long, heavy creak of bed timbers, too heavy for a small old woman.)*',
      'VOICE *(warm, slow, a little too smooth)*: Is that you, child?',
      '*(A pause. One slow breath, too deep.)*',
      "VOICE: Come in, come in. Shut the door behind you, there's a draught.",
      '*(The bed creaks once more, as if something shifts its weight.)*',
    ],
    placeholderNote: 'Audio (20–25 s, MP3 192 kbps) → /public/media/audio/grandmother-voice.mp3',
  },
  'image-1': {
    kind: 'image',
    src: '/media/images/illustration-1.webp',
    srcMobile: '/media/images/illustration-1-mobile.webp',
    alt: 'A small bedroom seen from the doorway, lit by one lamp turned very low. A figure lies in the bed against the far wall, face hidden under a nightcap. A dresser, a low window and a tall wardrobe stand in shadow.',
    aspect: '3 / 2',
    aspectMobile: '4 / 5',
    enlarge: true,
    placeholderNote: 'Illustration 1 (3:2, WebP under 400 KB) → /public/media/images/illustration-1.webp · phone crop (4:5) → illustration-1-mobile.webp',
  },
  'video-2': {
    kind: 'video',
    src: '/media/video/story-2.mp4',
    poster: '/media/images/story-2-poster.webp',
    captions: '/media/captions/story-2.vtt',
    title: 'The bedroom behind Red: the open window and the wardrobe in the wind',
    aspect: '16 / 9',
    optional: true,
    placeholderNote: 'Video 2 (8–10 s, under 5 MB) → /public/media/video/story-2.mp4 · optional: hidden on the live site if missing',
  },
  'image-2': {
    kind: 'image',
    src: '/media/images/illustration-2.webp',
    alt: 'An empty red hood hangs on black thorns at the edge of the forest. Far behind it, one window of the cottage glows faintly.',
    aspect: '4 / 5',
    enlarge: true,
    placeholderNote: 'Illustration 2 (4:5, WebP under 400 KB) → /public/media/images/illustration-2.webp',
  },
}
