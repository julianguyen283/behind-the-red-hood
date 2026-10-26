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
  poster: '/media/images/intro-poster.jpg',
  captions: '/media/captions/intro.vtt',
  title: 'Introductory first-person sequence: the walk to the cottage',
  aspect: '16 / 9',
  placeholderNote: 'Add the first-person POV introduction at /public/media/video/intro.mp4',
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
    title: 'The voice from the bedroom',
    credit: '',
    transcript: [
      '*(Silence. A long, heavy creak of bed timbers.)*',
      'VOICE: Is that you, child? Come in, come in. Shut the door behind you, there\'s a draught.',
      '*(A slow breath, too deep for an old woman.)*',
      'VOICE: Come where I can hear you.',
    ],
    placeholderNote: 'Audio (20–30 s) → /public/media/audio/grandmother-voice.mp3',
  },
  'image-1': {
    kind: 'image',
    src: '/media/images/illustration-1.jpg',
    alt: '[Alt text for Illustration 1 — describe the room from the doorway without pointing out the clues.]',
    caption: '',
    credit: '',
    aspect: '3 / 2',
    enlarge: true,
    placeholderNote: 'Illustration 1 → /public/media/images/illustration-1.jpg',
  },
  'video-2': {
    kind: 'video',
    src: '/media/video/story-2.mp4',
    poster: '/media/images/story-2-poster.jpg',
    captions: '/media/captions/story-2.vtt',
    title: '[Accessible title for video 2]',
    description: '',
    caption: '',
    credit: '',
    aspect: '21 / 9',
    placeholderNote: 'Video 2 (8–12 s, captioned, no flashing) → /public/media/video/story-2.mp4',
  },
  'image-2': {
    kind: 'image',
    src: '/media/images/illustration-2.jpg',
    alt: '[Alt text for Illustration 2]',
    caption: '',
    credit: '',
    aspect: '4 / 5',
    enlarge: true,
    placeholderNote: 'Illustration 2 → /public/media/images/illustration-2.jpg',
  },
}

/**
 * Optional ambient soundscape (user-controlled, never autoplays).
 * If this file is missing, a soft wind texture is synthesised in the
 * browser with the Web Audio API instead.
 */
export const ambientAudioSrc = '/media/audio/ambience.mp3'
