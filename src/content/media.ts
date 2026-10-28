/**
 * MEDIA CONFIGURATION
 * -------------------------------------------------------------------
 * Drop your files into /public/media/... using the paths below
 * (or change the paths). Any file that is missing automatically shows
 * an elegant, clearly labelled placeholder instead — so the site never
 * presents placeholder visuals as final footage.
 */

export type ImageMedia = {
  kind: 'image'
  src: string
  alt: string // describe the image for screen-reader users
  caption?: string // optional short line shown beneath
  credit?: string // e.g. "Illustration: [tool / artist], [year]"
  aspect: string // CSS aspect-ratio, used for the frame and placeholder
  placeholderNote: string
  /** true = readers can open the image full-screen ("tap to enlarge") */
  enlarge?: boolean
}

export type VideoMedia = {
  kind: 'video'
  src: string
  poster?: string
  captions?: string // WebVTT file
  title: string // accessible name for the player
  caption?: string
  credit?: string
  aspect: string
  placeholderNote: string
  /** Short visible text description (for videos with no dialogue). */
  description?: string
  /** Lines of text shown over the video at set times (seconds). */
  textCues?: { text: string; start: number; end: number }[]
}

export type AudioMedia = {
  kind: 'audio'
  src: string
  title: string
  credit?: string
  /** Full transcript, one entry per line. Wrap stage directions in *asterisks* for italics. */
  transcript: string[]
  placeholderNote: string
}

export const introVideo: VideoMedia = {
  kind: 'video',
  src: '/media/video/intro.mp4',
  poster: '/media/images/intro-poster.webp',
  captions: '/media/captions/intro.vtt',
  title: 'Introductory first-person sequence: the walk to the cottage',
  aspect: '16 / 9',
  placeholderNote: 'Add the first-person POV introduction at /public/media/video/intro.mp4',
  // The instructions Red carries into the forest, as sharp HTML text over the film.
  textCues: [
    { text: 'Stay on the path.', start: 3, end: 25 },
    { text: 'Don’t keep her waiting.', start: 10, end: 25 },
    { text: 'Be a good girl.', start: 18, end: 25 },
  ],
}

/** Shot list shown inside the intro placeholder until the real film is added. */
export const introShotList = [
  'Walking slowly through a dark forest',
  'Footsteps on fallen leaves',
  'Approaching an isolated cottage',
  'Knocking on the wooden door',
  'The door opens slowly into darkness',
]

/**
 * Story media. Each entry is placed in story.md with a marker such as
 * [[audio:audio-1]]. Current placement (from the story draft):
 *   audio-1 → after "Then a voice came from the bedroom."
 *   image-1 → after "Be a good girl and come and sit with me."
 *   video-2 → after Red falls into the yard (captioned, no flashing)
 *   image-2 → after the final line (rendered in the Ending section)
 * To add another piece of media, add an entry here with a new id and
 * put its marker in story.md.
 */
export const storyMedia: Record<string, ImageMedia | VideoMedia | AudioMedia> = {
  'audio-1': {
    kind: 'audio',
    src: '/media/audio/grandmother-voice.mp3',
    title: 'Listen at the door',
    credit: '',
    transcript: [
      '*(Silence. A long, heavy creak of bed timbers, too heavy for a small old woman.)*',
      'VOICE *(warm, slow, a little too smooth)*: Is that you, child?',
      '*(A pause. One slow breath, too deep.)*',
      "VOICE: Come in, come in. Shut the door behind you, there's a draught.",
      '*(The bed creaks once more, as if something shifts its weight.)*',
    ],
    placeholderNote: 'Audio (20–25 s) → /public/media/audio/grandmother-voice.mp3',
  },
  'image-1': {
    kind: 'image',
    src: '/media/images/illustration-1.webp',
    alt: 'A small bedroom seen from the doorway, lit by one lamp turned very low. A figure lies in the bed against the far wall, face hidden under a nightcap. A dresser, a low window and a tall wardrobe stand in shadow.',
    caption: '',
    credit: '',
    aspect: '3 / 2',
    enlarge: true,
    placeholderNote: 'Illustration 1 → /public/media/images/illustration-1.webp',
  },
  'video-2': {
    kind: 'video',
    src: '/media/video/story-2.mp4',
    poster: '/media/images/story-2-poster.webp',
    captions: '/media/captions/story-2.vtt',
    title: 'The bedroom behind Red: the open window, the dying fire and the wardrobe in the wind',
    description: '',
    caption: '',
    credit: '',
    aspect: '16 / 9',
    placeholderNote: 'Video 2 (8–10 s) → /public/media/video/story-2.mp4',
  },
  'image-2': {
    kind: 'image',
    src: '/media/images/illustration-2.webp',
    alt: 'An empty red hood hangs on black thorns at the edge of the forest. Far behind it, one window of the cottage glows faintly.',
    caption: '',
    credit: '',
    aspect: '4 / 5',
    enlarge: true,
    placeholderNote: 'Illustration 2 → /public/media/images/illustration-2.webp',
  },
}

/**
 * Optional ambient soundscape (user-controlled, never autoplays).
 * If this file is missing, a soft wind texture is synthesised in the
 * browser with the Web Audio API instead.
 */
export const ambientAudioSrc = '/media/audio/ambience.mp3'
