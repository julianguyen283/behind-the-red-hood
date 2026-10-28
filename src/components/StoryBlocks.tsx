import type { ReactNode } from 'react'
import type { StoryBlock } from '../lib/parseStory'
import { isPlaceholder } from '../lib/parseStory'
import { SenseGlyph } from './Icons'
import { Inline } from './Inline'
import { Reveal } from './Reveal'
import { RoomPanel, RoomPause, RoomScene } from './RoomScene'
import { StoryMedia } from './StoryMedia'

const column = 'mx-auto w-full max-w-[var(--story-width)]'

function renderBlock(block: StoryBlock, i: number, dropCap: boolean): ReactNode {
  switch (block.type) {
    case 'p': {
      const placeholder = isPlaceholder(block.text)
      return (
        <Reveal as="p" key={i} rise={12} className={`${column} ${dropCap ? 'drop-cap' : ''} ${placeholder ? '!text-ivory/45 italic' : ''}`}>
          <Inline text={block.text} />
        </Reveal>
      )
    }
    case 'line':
      return (
        <Reveal key={i} rise={10} className={`${column} my-14 text-center md:my-20`}>
          <p className="!indent-0 font-fell !text-[clamp(1.3rem,1vw+1.1rem,1.75rem)] !leading-snug text-ivory italic">
            <Inline text={block.text} />
          </p>
        </Reveal>
      )
    case 'pause':
      return (
        <div key={i} aria-hidden="true" className={`${column} my-14 text-center font-display text-xl tracking-[1em] text-blood md:my-20`}>
          ⁂
        </div>
      )
    case 'sense':
      return (
        <Reveal key={i} rise={0} className={`${column} my-16 flex items-center gap-5 text-blood md:my-24`}>
          <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-r from-transparent to-blood/50" />
          <SenseGlyph sense={block.sense} />
          <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-l from-transparent to-blood/50" />
        </Reveal>
      )
    case 'media':
      return <StoryMedia key={i} id={block.id} />
    // invisible markers, read while scrolling
    case 'light':
      return <div key={i} data-light={block.target} aria-hidden="true" />
    case 'scene':
      return <div key={i} data-scene={block.name} aria-hidden="true" />
    case 'call':
      return <div key={i} data-call aria-hidden="true" className="h-px" />
    case 'room':
      return null
  }
}

/** The blocks between [[room:start]] and [[room:end]]: text on panels, [[room:pause]] as open views. */
function renderRoom(blocks: { block: StoryBlock; i: number }[]): ReactNode {
  const out: ReactNode[] = []
  let panel: ReactNode[] = []
  const flush = () => {
    if (panel.length) out.push(<RoomPanel key={`panel-${out.length}`}>{panel}</RoomPanel>)
    panel = []
  }
  for (const { block, i } of blocks) {
    if (block.type === 'room' && block.edge === 'pause') {
      flush()
      out.push(<RoomPause key={i} />)
    } else if (block.type === 'light' && (panel.length || out.length)) {
      // the light moves in a gap between panels, so the reader sees it go
      flush()
      out.push(
        <div key={i} data-light={block.target} aria-hidden="true" className="h-[48svh]" />,
      )
    } else panel.push(renderBlock(block, i, false))
  }
  flush()
  return out
}

/** Renders parsed story blocks with book-like typography. */
export function StoryBlocks({ blocks, dropCap = true }: { blocks: StoryBlock[]; dropCap?: boolean }) {
  const firstP = blocks.findIndex((b) => b.type === 'p')
  const out: ReactNode[] = []
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]
    if (block.type === 'room' && block.edge === 'start') {
      const inner: { block: StoryBlock; i: number }[] = []
      let j = i + 1
      for (; j < blocks.length; j++) {
        const b = blocks[j]
        if (b.type === 'room' && b.edge === 'end') break
        inner.push({ block: b, i: j })
      }
      out.push(<RoomScene key={`room-${i}`}>{renderRoom(inner)}</RoomScene>)
      i = j
      continue
    }
    out.push(renderBlock(block, i, dropCap && i === firstP))
  }
  return <div className="story-prose">{out}</div>
}
