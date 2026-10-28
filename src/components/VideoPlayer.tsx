import { useRef, useState, type ReactNode } from 'react'
import type { TextCue } from '../content/media'
import { PlayIcon } from './Icons'
import { MediaPlaceholder } from './MediaPlaceholder'

type Props = {
  src: string
  poster?: string
  captions?: string
  title: string
  aspect: string
  placeholderNote: string
  textCues?: TextCue[]
  optional?: boolean
  placeholderExtra?: ReactNode
  playButtonId?: string
}

/**
 * Click-to-play video with native controls (reliable on iPhone), WebVTT
 * captions, a poster frame, and optional lines of HTML text timed over it.
 */
export function VideoPlayer({ src, poster, captions, title, aspect, placeholderNote, textCues, optional, placeholderExtra, playButtonId }: Props) {
  const video = useRef<HTMLVideoElement>(null)
  const [missing, setMissing] = useState(false)
  const [started, setStarted] = useState(false)
  const [time, setTime] = useState(0)

  if (missing) {
    if (optional && !import.meta.env.DEV) return null
    return (
      <MediaPlaceholder kind="video" note={placeholderNote} aspect={placeholderExtra ? undefined : aspect}>
        {placeholderExtra}
      </MediaPlaceholder>
    )
  }

  return (
    <div className="relative w-full overflow-hidden bg-black" style={{ aspectRatio: aspect }}>
      <video
        ref={video}
        className="absolute inset-0 h-full w-full object-contain"
        src={src}
        poster={poster}
        controls={started}
        playsInline
        preload="metadata"
        aria-label={title}
        onError={() => setMissing(true)}
        onPlay={() => setStarted(true)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
      >
        {captions && <track kind="captions" srcLang="en" label="English" src={captions} default />}
      </video>

      {/* lines of text over the film — real text, so screen readers get them too */}
      {textCues && (
        <div className="pointer-events-none absolute inset-x-0 top-[22%] flex flex-col items-center gap-3 px-6 text-center md:gap-5">
          {textCues.map((cue) => {
            const shown = started && time >= cue.start && time < cue.end
            return (
              <p
                key={cue.text}
                className="font-display text-[clamp(1.5rem,3.4vw,2.75rem)] leading-tight font-medium text-ivory italic transition-opacity duration-[1200ms] [text-shadow:0_1px_14px_rgb(0_0_0/0.85)]"
                style={{ opacity: shown ? 1 : 0 }}
              >
                {cue.text}
              </p>
            )
          })}
        </div>
      )}

      {!started && (
        <button
          type="button"
          id={playButtonId}
          onClick={() => void video.current?.play().catch(() => {})}
          className="group absolute inset-0 flex items-center justify-center"
          aria-label={`Play: ${title}`}
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-blood text-ivory transition-transform duration-300 group-hover:scale-105 md:h-20 md:w-20">
            <PlayIcon width={26} height={26} />
          </span>
        </button>
      )}
    </div>
  )
}
