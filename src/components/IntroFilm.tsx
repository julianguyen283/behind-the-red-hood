import { forwardRef } from 'react'
import { introShotList, introVideo } from '../content/media'
import { VideoPlayer } from './VideoPlayer'

export const INTRO_PLAY_ID = 'intro-play'

/** Storyboard shown inside the placeholder until the real film exists. */
function ShotList() {
  return (
    <div className="mx-auto grid max-w-4xl gap-6 text-left md:grid-cols-[1fr_auto]">
      <ol className="space-y-1.5">
        {introShotList.map(([t, shot]) => (
          <li key={t} className="text-ui grid grid-cols-[3rem_1fr] text-muted">
            <span className="tabular-nums text-ivory/70">{t}</span>
            {shot}
          </li>
        ))}
      </ol>
      <div className="border-l border-mist/50 pl-5">
        <p className="text-ui mb-2 text-muted">On-screen text</p>
        {introVideo.textCues?.map((c) => (
          <p key={c.text} className="font-display text-2xl text-ivory italic">
            {c.text}
          </p>
        ))}
      </div>
    </div>
  )
}

/** Full-width opening film, directly under the title screen. */
export const IntroFilm = forwardRef<HTMLElement>(function IntroFilm(_, ref) {
  return (
    <section ref={ref} id="intro" data-thread-start tabIndex={-1} aria-label="Opening film" className="relative outline-none">
      <div className="mx-auto w-full max-w-[min(100%,calc(92svh*16/9))]">
        <VideoPlayer {...introVideo} playButtonId={INTRO_PLAY_ID} placeholderExtra={<ShotList />} />
      </div>
    </section>
  )
})
