export type StoryBlock =
  | { type: 'p'; text: string }
  | { type: 'line'; text: string }
  | { type: 'pause' }
  | { type: 'media'; id: string }
  | { type: 'sense'; sense: Sense }

export type Sense = 'ears' | 'eyes' | 'teeth'

const MEDIA = /^\[\[(?:image|video|audio):([\w-]+)\]\]$/
const SENSE = /^\[\[sense:(ears|eyes|teeth)\]\]$/
const PAUSE = /^(\*\s*){3}$/

/** Turns the plain-text story format (see story.md) into typed blocks. */
export function parseStory(raw: string): StoryBlock[] {
  return raw
    .replace(/<!--[\s\S]*?-->/g, '')
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim().replace(/\s*\n\s*/g, ' '))
    .filter(Boolean)
    .map((chunk): StoryBlock => {
      const media = chunk.match(MEDIA)
      if (media) return { type: 'media', id: media[1] }
      const sense = chunk.match(SENSE)
      if (sense) return { type: 'sense', sense: sense[1] as Sense }
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

/** True while a block is still a bracketed placeholder. */
export const isPlaceholder = (text: string) => /^\[.*\]$/.test(text.trim())
