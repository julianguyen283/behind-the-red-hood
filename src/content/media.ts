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
  /** true = the image starts almost black and is uncovered as the reader scrolls */
  lookBack?: boolean
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

/**
 * Bump this number whenever you replace a media file with one of the same
 * name, so browsers fetch the new file instead of a cached old one.
 */
export const MEDIA_VERSION = 5
const v = (path: string) => `${path}?v=${MEDIA_VERSION}`

export const introVideo: VideoMedia = {
  kind: 'video',
  src: v('/media/video/intro.mp4'),
  poster: v('/media/images/intro-poster.webp'),
  captions: v('/media/captions/intro.vtt'),
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
 *   image-2 → after the final line (rendered in the Ending section)
 * To add another piece of media, add an entry here with a new id and
 * put its marker in story.md.
 */
export const storyMedia: Record<string, ImageMedia | VideoMedia | AudioMedia> = {
  'audio-1': {
    kind: 'audio',
    src: v('/media/audio/grandmother-voice.mp3'),
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
    src: v('/media/images/illustration-1.webp'),
    alt: 'A small bedroom seen from the doorway, lit by one lamp turned very low. A figure lies in the bed against the far wall, face hidden under a nightcap. A dresser, a low window and a tall wardrobe stand in shadow.',
    caption: '',
    credit: '',
    aspect: '3 / 2',
    enlarge: true,
    placeholderNote: 'Illustration 1 → /public/media/images/illustration-1.webp',
  },
  'image-2': {
    kind: 'image',
    src: v('/media/images/illustration-2.webp'),
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
export const ambientAudioSrc = v('/media/audio/ambience.mp3')

/**
 * THE BEDROOM SCENE
 * Between [[room:start]] and [[room:end]] in story.md, Illustration 1 stays
 * fixed behind the text and a lamp-light moves to whatever Red is looking at.
 * A [[light:name]] marker moves the light to one of these spots.
 *   x, y    position in the picture (0–1, from the left / top)
 *   radius  size of the pool of light (fraction of the picture's width)
 *   dark    how dark everything outside the light is (0 = none, 1 = black)
 *   inline  true = changes without a gap in the text
 *   glance  true = the light only drifts here and is pulled back
 *   jolt    true = the picture jerks once (no change of light)
 *   tint    colour of the light pool; flicker = firelight
 */
type Light = { x: number; y: number; radius: number; dark: number; inline?: boolean; glance?: boolean; jolt?: boolean; tint?: string; flicker?: boolean }
export const room = {
  src: v('/media/images/illustration-1.webp'),
  alt: 'A small bedroom seen from the doorway, lit by one lamp turned very low. A figure lies in the bed against the far wall, face hidden under a nightcap. A dresser, a low window and a tall wardrobe stand in shadow.',
  width: 1536,
  height: 1024,
  lights: {
    lamp: { x: 0.11, y: 0.4, radius: 0.15, dark: 0.9 },
    head: { x: 0.51, y: 0.31, radius: 0.12, dark: 0.9 },
    all: { x: 0.5, y: 0.5, radius: 1.3, dark: 0.15 },
    spectacles: { x: 0.68, y: 0.4, radius: 0.08, dark: 0.92 },
    bedpost: { x: 0.38, y: 0.53, radius: 0.07, dark: 0.92 },
    wardrobe: { x: 0.85, y: 0.33, radius: 0.07, dark: 0.94, inline: true, glance: true },
    jolt: { x: 0.5, y: 0.5, radius: 0, dark: 0.97, inline: true, glance: true, jolt: true },
    fire: { x: 0.47, y: 0.86, radius: 0.55, dark: 0.55, inline: true, tint: '255,120,50', flicker: true },
    out: { x: 0.11, y: 0.4, radius: 0, dark: 0.97 },
  } as Record<string, Light>,
}

/**
 * SOUNDSCAPE (only when the reader turns Sound on)
 * Each loop plays continuously; a [[scene:name]] marker in story.md or
 * ending.md cross-fades to that scene's mix (levels 0–1 per loop).
 */
export const soundscape = {
  loops: {
    forest: v('/media/audio/ambience.mp3'),
    kitchen: v('/media/audio/kitchen.mp3'),
    bedroom: v('/media/audio/bedroom.mp3'),
    night: v('/media/audio/night.mp3'),
  } as Record<string, string>,
  scenes: {
    forest: { forest: 1 },
    kitchen: { kitchen: 1 },
    bedroom1: { kitchen: 0.4, bedroom: 0.5 },
    bedroom2: { bedroom: 0.8 },
    bedroom3: { bedroom: 1 },
    silence: {},
    night: { night: 1 },
  } as Record<string, Record<string, number>>,
  /** One-off sounds triggered by [[sfx:name]] markers. */
  sfx: {
    latch: v('/media/audio/latch.mp3'),
    rise: v('/media/audio/rise.mp3'),
    glass: v('/media/audio/glass.mp3'),
    tear: v('/media/audio/tear.mp3'),
    run: v('/media/audio/run.mp3'),
    // the author's own voice saying the wrong word, when the reader asks for the answer
    child: v('/media/audio/answer-child.mp3'),
  } as Record<string, string>,
  /** The faint call after the last line ([[call]] in ending.md). */
  call: v('/media/audio/child-call.mp3'),
}
