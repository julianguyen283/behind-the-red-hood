import { useRef } from 'react'
import { MotionConfig } from 'motion/react'
import { SoundProvider } from './hooks/useAmbientSound'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { INTRO_PLAY_ID, IntroFilm } from './components/IntroFilm'
import { Story, storyBlocks } from './components/Story'
import { Ending, endingBlocks } from './components/Ending'
import { Credits } from './components/Credits'
import { RedThread } from './components/RedThread'
import { DevWordCount } from './components/DevWordCount'

export default function App() {
  const intro = useRef<HTMLElement>(null)

  const enter = () => {
    const section = intro.current
    if (!section) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    section.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' })
    // Move keyboard focus with the reader: to the play button if a film exists.
    const play = document.getElementById(INTRO_PLAY_ID)
    ;(play ?? section).focus({ preventScroll: true })
  }

  return (
    <MotionConfig reducedMotion="user">
      <SoundProvider>
        <a href="#story" className="sr-only z-50 bg-ivory px-4 py-2 font-ui text-sm text-void focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
          Skip to the story
        </a>
        <Header />
        <main id="top" className="relative">
          <RedThread />
          <Hero onEnter={enter} />
          <IntroFilm ref={intro} />
          <Story />
          <Ending />
        </main>
        <Credits />
        {import.meta.env.DEV && <DevWordCount story={storyBlocks} ending={endingBlocks} />}
      </SoundProvider>
    </MotionConfig>
  )
}
