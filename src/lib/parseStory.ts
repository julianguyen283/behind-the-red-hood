export type Mood = 'forest' | 'kitchen' | 'bedroom' | 'night'

export type StoryBlock =
  | { type: 'p'; text: string }
  | { type: 'line'; text: string }
  | { type: 'pause' }
  | { type: 'media'; id: string }
  | { type: 'mood'; mood: Mood }
  | { type: 'reveal'; on: boolean }

const MEDIA = /^\[\[(?:image|video|audio):([\w-]+)\]\]$/
const MOOD = /^\[\[mood:(forest|kitchen|bedroom|night)\]\]$/
const REVEAL = /^\[\[reveal:(on|off)\]\]$/
const PAUSE = /^(\*\s*){3}$/

/** Turns the plain-text story format (see story.md) into typed blocks. */
export function parseStory(raw: string): StoryBlock[] {
  return raw
    .replace(/<!--[\s\S]*?-->/g, '')
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim().replace(/\s*\n\s*/g, ' '))
    .filter(Boolean)
    .map((chunk): StoryBlock => {
      let m
      if ((m = chunk.match(MEDIA))) return { type: 'media', id: m[1] }
      if ((m = chunk.match(MOOD))) return { type: 'mood', mood: m[1] as Mood }
      if ((m = chunk.match(REVEAL))) return { type: 'reveal', on: m[1] === 'on' }
      if (PAUSE.test(chunk)) return { type: 'pause' }
      if (chunk.startsWith('>')) return { type: 'line', text: chunk.replace(/^>\s*/, '') }
      return { type: 'p', text: chunk }
    })
}

export function countWords(blocks: StoryBlock[]): number {
  return blocks.reduce((n, b) => {
    if (b.type !== 'p' && b.type !== 'line') return n
    return n + b.text.replace(/\[\[[^\]]*\]\]|\*/g, '').split(/\s+/).filter(Boolean).length
  }, 0)
}
