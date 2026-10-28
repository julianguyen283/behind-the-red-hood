import { useRef } from 'react'
import { motion, useScroll, useSpring } from 'motion/react'
import storyRaw from '../content/story.md?raw'
import { parseStory } from '../lib/parseStory'
import { StoryBlocks } from './StoryBlocks'

export const storyBlocks = parseStory(storyRaw)

export function Story() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })

  return (
    <section ref={ref} id="story" aria-label="The story" className="relative bg-void px-5 pt-16 pb-32 sm:px-8 md:pt-24 md:pb-48">
      {/* reading progress hairline */}
      <motion.div aria-hidden="true" style={{ scaleX: progress }} className="fixed inset-x-0 top-0 z-40 h-px origin-left bg-crimson/80" />

      <div aria-hidden="true" className="mx-auto mb-20 h-24 w-px bg-gradient-to-b from-transparent via-blood/60 to-transparent md:mb-28" />

      <article>
        <StoryBlocks blocks={storyBlocks} />
      </article>
    </section>
  )
}
