import type { StoryBlock } from '../lib/parseStory'
import { Inline } from './Inline'
import { Reveal } from './Reveal'
import { StoryMedia } from './StoryMedia'

const column = 'mx-auto w-full max-w-[var(--story-width)]'

/** Renders parsed story blocks with book-like typography. */
export function StoryBlocks({ blocks, dropCap = true }: { blocks: StoryBlock[]; dropCap?: boolean }) {
  const firstP = blocks.findIndex((b) => b.type === 'p')
  let reveal = true
  return (
    <div className="story-prose">
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'reveal':
            reveal = block.on
            return null
          case 'mood':
            // invisible anchor read by <PageMood />
            return <div key={i} data-mood={block.mood} aria-hidden="true" />
          case 'p':
            return (
              <Reveal as="p" key={i} enabled={reveal} className={`${column} ${dropCap && i === firstP ? 'drop-cap' : ''}`}>
                <Inline text={block.text} />
              </Reveal>
            )
          case 'line':
            return (
              <Reveal key={i} enabled={reveal} className={`${column} my-14 text-center md:my-20`}>
                <p className="!indent-0 font-display !text-[clamp(1.5rem,1.2vw+1.2rem,2rem)] !leading-snug font-medium italic">
                  <Inline text={block.text} />
                </p>
              </Reveal>
            )
          case 'pause':
            return (
              <div key={i} aria-hidden="true" className={`${column} my-14 text-center font-display text-xl tracking-[1em] text-mist`}>
                ⁂
              </div>
            )
          case 'media':
            return <StoryMedia key={i} id={block.id} />
        }
      })}
    </div>
  )
}
