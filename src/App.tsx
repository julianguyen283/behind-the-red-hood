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
import { SceneController } from './components/SceneController'
import { DevWordCount } from './components/DevWordCount'

export default function App() {
  const intro = useRef<HTMLElement>(null)

  const enter = (withSound: boolean) => {
    const section = intro.current
    if (!section) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    section.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' })
    // Entering with sound starts the film too (inside the click, so the browser allows it).
    const film = section.querySelector('video')
    if (withSound && film) {
      film.muted = false
      void film.play().catch(() => {})
      section.focus({ preventScroll: true })
      return
    }
    // Otherwise move keyboard focus to the play button, if the film exists.
    const play = document.getElementById(INTRO_PLAY_ID)
    ;(play ?? section).focus({ preventScroll: true })
  }

  return (
    <MotionConfig reducedMotion="user">
      <SoundProvider>
        <a href="#story" className="sr-only z-50 bg-ivory px-4 py-2 font-ui text-sm text-void focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
          Skip to the story
        </a>
        <SceneController />
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
