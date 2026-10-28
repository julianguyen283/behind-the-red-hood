export type StoryBlock =
  | { type: 'p'; text: string; ghost?: string }
  | { type: 'line'; text: string }
  | { type: 'pause' }
  | { type: 'media'; id: string }
  | { type: 'sense'; sense: Sense }
  | { type: 'room'; edge: 'start' | 'end' | 'pause' }
  | { type: 'light'; target: string }
  | { type: 'scene'; name: string }
  | { type: 'call' }
  | { type: 'sfx'; name: string }
  | { type: 'ghost'; text: string }

export type Sense = 'ears' | 'eyes' | 'teeth'

const MEDIA = /^\[\[(?:image|video|audio):([\w-]+)\]\]$/
const SENSE = /^\[\[sense:(ears|eyes|teeth)\]\]$/
const PAUSE = /^(\*\s*){3}$/
const ROOM = /^\[\[room:(start|end|pause)\]\]$/
const LIGHT = /^\[\[light:([\w-]+)\]\]$/
const SCENE = /^\[\[scene:([\w-]+)\]\]$/
const CALL = /^\[\[call\]\]$/
const SFX = /^\[\[sfx:([\w-]+)\]\]$/
const GHOST = /^\[\[ghost:(.+)\]\]$/

/** Turns the plain-text story format (see story.md) into typed blocks. */
export function parseStory(raw: string): StoryBlock[] {
  const blocks = raw
    .replace(/<!--[\s\S]*?-->/g, '')
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim().replace(/\s*\n\s*/g, ' '))
    .filter(Boolean)
    .map((chunk): StoryBlock => {
      const media = chunk.match(MEDIA)
      if (media) return { type: 'media', id: media[1] }
      const sense = chunk.match(SENSE)
      if (sense) return { type: 'sense', sense: sense[1] as Sense }
      let m
      if ((m = chunk.match(ROOM))) return { type: 'room', edge: m[1] as 'start' | 'end' | 'pause' }
      if ((m = chunk.match(LIGHT))) return { type: 'light', target: m[1] }
      if ((m = chunk.match(SCENE))) return { type: 'scene', name: m[1] }
      if (CALL.test(chunk)) return { type: 'call' }
      if ((m = chunk.match(SFX))) return { type: 'sfx', name: m[1] }
      if ((m = chunk.match(GHOST))) return { type: 'ghost', text: m[1] }
      if (PAUSE.test(chunk)) return { type: 'pause' }
      if (chunk.startsWith('>')) return { type: 'line', text: chunk.replace(/^>\s*/, '') }
      return { type: 'p', text: chunk }
    })
  // a [[ghost:...]] line is drawn under the paragraph that follows it
  return blocks.flatMap((b, i): StoryBlock[] => {
    if (b.type === 'ghost') return []
    const prev = blocks[i - 1]
    if (b.type === 'p' && prev?.type === 'ghost') return [{ ...b, ghost: prev.text }]
    return [b]
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
