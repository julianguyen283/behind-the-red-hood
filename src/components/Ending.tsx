import endingRaw from '../content/ending.md?raw'
import { storyMedia, type ImageMedia } from '../content/media'
import { parseStory } from '../lib/parseStory'
import { Reveal } from './Reveal'
import { StoryBlocks } from './StoryBlocks'
import { StoryImage } from './StoryMedia'

export const endingBlocks = parseStory(endingRaw)

/** The last lines, then Illustration 2 alone with plenty of darkness around it. */
export function Ending() {
  const image = storyMedia['image-2'] as ImageMedia | undefined
  return (
    <section aria-label="Ending" className="relative px-5 pb-[30vh] sm:px-8">
      <StoryBlocks blocks={endingBlocks} dropCap={false} />
      {image && (
        <Reveal as="figure" className="mx-auto mt-[30vh] w-full max-w-md">
          <StoryImage media={image} />
        </Reveal>
      )}
    </section>
  )
}
