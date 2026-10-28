import endingRaw from '../content/ending.md?raw'
import { parseStory } from '../lib/parseStory'
import { StoryBlocks } from './StoryBlocks'
import { StoryMedia } from './StoryMedia'

export const endingBlocks = parseStory(endingRaw)

export function Ending() {
  return (
    <section aria-label="Ending" className="relative overflow-hidden bg-void px-5 pt-0 pb-40 sm:px-8 md:pb-56">
      {/* the light at the end is cold, and a little red */}
      <div aria-hidden="true" className="ember pointer-events-none absolute inset-x-0 bottom-0 h-[70%] bg-[radial-gradient(ellipse_at_50%_100%,color-mix(in_srgb,var(--color-blood)_28%,transparent),transparent_65%)]" />
      <div aria-hidden="true" className="fog-layer bottom-[10%] h-[40%] opacity-60" style={{ animationDuration: '70s' }} />

      <div className="relative">
        <StoryBlocks blocks={endingBlocks} dropCap={false} />
        <StoryMedia id="image-2" />
      </div>
    </section>
  )
}
