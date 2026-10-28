import storyRaw from '../content/story.md?raw'
import { parseStory } from '../lib/parseStory'
import { StoryBlocks } from './StoryBlocks'

export const storyBlocks = parseStory(storyRaw)

export function Story() {
  return (
    <section id="story" aria-label="The story" className="relative bg-void px-5 pt-16 pb-0 sm:px-8 md:pt-24">
      <div aria-hidden="true" className="mx-auto mb-20 h-24 w-px bg-gradient-to-b from-transparent via-blood/60 to-transparent md:mb-28" />

      <article>
        <StoryBlocks blocks={storyBlocks} />
      </article>
    </section>
  )
}
