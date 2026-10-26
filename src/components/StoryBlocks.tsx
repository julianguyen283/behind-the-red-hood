import type { StoryBlock } from '../lib/parseStory'
import { isPlaceholder } from '../lib/parseStory'
import { SenseGlyph } from './Icons'
import { Inline } from './Inline'
import { Reveal } from './Reveal'
import { StoryMedia } from './StoryMedia'

const column = 'mx-auto w-full max-w-[var(--story-width)]'

/** Renders parsed story blocks with book-like typography. */
export function StoryBlocks({ blocks, dropCap = true }: { blocks: StoryBlock[]; dropCap?: boolean }) {
  const firstP = blocks.findIndex((b) => b.type === 'p')
  return (
    <div className="story-prose">
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'p': {
            const placeholder = isPlaceholder(block.text)
            return (
              <Reveal as="p" key={i} rise={12} className={`${column} ${dropCap && i === firstP ? 'drop-cap' : ''} ${placeholder ? '!text-ivory/45 italic' : ''}`}>
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
        }
      })}
    </div>
  )
}
