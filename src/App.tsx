import { useRef } from 'react'
import { MotionConfig } from 'motion/react'
import { Hero } from './components/Hero'
import { INTRO_PLAY_ID, IntroFilm } from './components/IntroFilm'
import { Story, storyBlocks } from './components/Story'
import { Ending, endingBlocks } from './components/Ending'
import { Credits } from './components/Credits'
import { PageMood } from './components/PageMood'
import { RedThread } from './components/RedThread'
import { DevWordCount } from './components/DevWordCount'

export default function App() {
  const intro = useRef<HTMLElement>(null)

  const enter = () => {
    const section = intro.current
    if (!section) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    section.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' })
    // Move keyboard focus with the reader: to the film's play button if the film exists.
    const play = document.getElementById(INTRO_PLAY_ID)
    ;(play ?? section).focus({ preventScroll: true })
  }

  return (
    <MotionConfig reducedMotion="user">
      <PageMood />
      <div className="page-vignette" aria-hidden="true" />
      <div className="page-grain" aria-hidden="true" />
      <a href="#story" className="text-ui sr-only z-[70] bg-ivory px-4 py-2 text-void focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        Skip to the story
      </a>
      <main className="relative">
        <RedThread />
        <Hero onEnter={enter} />
        <IntroFilm ref={intro} />
        <Story />
        <Ending />
      </main>
      <Credits />
      {import.meta.env.DEV && <DevWordCount story={storyBlocks} ending={endingBlocks} />}
    </MotionConfig>
  )
}
