import { useRef, useState } from 'react'
import type { AudioMedia } from '../content/media'
import { PauseIcon, PlayIcon } from './Icons'
import { Inline } from './Inline'

/**
 * "Listen at the door": a small box the reader may use or skip.
 * Never autoplays; the transcript is always available below.
 */
export function AudioPlayer({ media }: { media: AudioMedia }) {
  const audio = useRef<HTMLAudioElement>(null)
  const [missing, setMissing] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)

  const toggle = () => {
    const a = audio.current
    if (!a) return
    if (a.paused) void a.play().catch(() => {})
    else a.pause()
  }

  return (
    <div className="mx-auto w-full max-w-md bg-charcoal p-5 md:p-6">
      <audio
        ref={audio}
        src={media.src}
        preload="metadata"
        onError={() => setMissing(true)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime / (e.currentTarget.duration || 1))}
      />

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={toggle}
          disabled={missing}
          aria-label={playing ? 'Pause the voice from the bedroom' : media.buttonLabel}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blood text-ivory transition-transform duration-300 hover:scale-105 disabled:opacity-40"
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-ui text-ivory">{media.label}</p>
          <div className="mt-2 h-px w-full bg-mist/50" aria-hidden="true">
            <div className="h-px bg-ivory/80" style={{ width: `${progress * 100}%` }} />
          </div>
        </div>
      </div>

      {missing && <p className="text-ui mt-3 text-muted">Audio placeholder: {media.placeholderNote}</p>}

      <details className="group mt-4">
        <summary className="text-ui cursor-pointer text-muted underline decoration-mist underline-offset-4 hover:text-ivory">
          Read transcript
        </summary>
        <div className="mt-3 space-y-2 font-story text-[1.0625rem] leading-relaxed text-ivory [&_em]:text-muted">
          {media.transcript.map((line, i) => (
            <p key={i} className="!indent-0">
              <Inline text={line} />
            </p>
          ))}
        </div>
      </details>
    </div>
  )
}
