import { forwardRef } from 'react'
import { introShotList, introVideo } from '../content/media'
import { site } from '../content/site'
import { Reveal } from './Reveal'
import { VideoPlayer } from './VideoPlayer'

export const INTRO_PLAY_ID = 'intro-play'

/** Storyboard shown inside the placeholder until the real POV film exists. */
function ShotList() {
  return (
    <ol className="mx-auto grid max-w-3xl gap-px bg-ivory/10 text-left sm:grid-cols-5">
      {introShotList.map((shot, i) => (
        <li key={shot} className="bg-charcoal/95 px-4 py-4">
          <span className="block font-ui text-[0.6rem] tracking-[0.3em] text-crimson/80">SHOT {String(i + 1).padStart(2, '0')}</span>
          <span className="mt-2 block font-story text-[0.98rem] leading-snug text-ivory/70 italic">{shot}</span>
        </li>
      ))}
    </ol>
  )
}

export const IntroFilm = forwardRef<HTMLElement>(function IntroFilm(_, ref) {
  return (
    <section ref={ref} id="intro" data-thread-start tabIndex={-1} aria-labelledby="intro-heading" className="relative bg-void px-5 py-24 outline-none md:py-36">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-void to-transparent" />
      <Reveal className="mx-auto mb-10 max-w-3xl text-center md:mb-14">
        <h2 id="intro-heading" className="font-ui text-[0.65rem] tracking-[0.5em] text-crimson uppercase">
          {site.introEyebrow}
        </h2>
        {site.introLine && <p className="mt-5 font-fell text-xl text-ivory/70 italic md:text-2xl">{site.introLine}</p>}
      </Reveal>

      <Reveal rise={30} className="mx-auto max-w-6xl">
        <div className="relative">
          {/* thin frame lines, like a film gate */}
          <div aria-hidden="true" className="absolute -inset-3 border border-ivory/5 md:-inset-5" />
          <VideoPlayer
            {...introVideo}
            mode="feature"
            playButtonId={INTRO_PLAY_ID}
            placeholderExtra={<ShotList />}
            endLine={site.introEndLine}
            textCues={introVideo.textCues}
          />
        </div>
        <p className="mt-10 text-center font-ui text-[0.65rem] tracking-[0.25em] text-ivory/35 uppercase">
          Best experienced with sound · Captions available
        </p>
      </Reveal>
    </section>
  )
})
