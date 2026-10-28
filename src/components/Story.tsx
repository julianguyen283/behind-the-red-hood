import storyRaw from '../content/story.md?raw'
import { parseStory } from '../lib/parseStory'
import { StoryBlocks } from './StoryBlocks'

export const storyBlocks = parseStory(storyRaw)

export function Story() {
  return (
    <article id="story" aria-label="The story" className="relative px-5 pt-20 pb-16 sm:px-8 md:pt-32">
      <StoryBlocks blocks={storyBlocks} />
    </article>
  )
}
