import { useRef, useState } from 'react'
import type { AudioMedia } from '../content/media'
import { useDuck } from '../hooks/useAmbientSound'
import { PauseIcon, PlayIcon } from './Icons'
import { Inline } from './Inline'
import { MediaPlaceholder } from './MediaPlaceholder'

const BARS = 48

/**
 * A listening moment: the reader chooses to hear the voice themselves.
 * The transcript is always available beneath the player.
 */
export function AudioPlayer({ media }: { media: AudioMedia }) {
  const audio = useRef<HTMLAudioElement>(null)
  const [missing, setMissing] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [open, setOpen] = useState(false)

  useDuck(playing)

  const toggle = () => {
    const a = audio.current
    if (!a) return
    if (a.paused) void a.play().catch(() => {})
    else a.pause()
  }

  const transcriptId = `${media.src}-transcript`

  return (
    <div className="mx-auto w-full max-w-xl">
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

      {missing ? (
        <MediaPlaceholder kind="audio" note={media.placeholderNote} />
      ) : (
        <div className="flex items-center gap-5 border-y border-ivory/10 py-5">
          <button
            type="button"
            onClick={toggle}
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-ivory/30 text-ivory transition-colors duration-700 hover:border-crimson hover:text-crimson"
            aria-label={`${playing ? 'Pause' : 'Listen'}: ${media.title}`}
          >
            {playing ? <PauseIcon /> : <PlayIcon />}
          </button>
          {/* static waveform; bars fill crimson as the recording plays */}
          <div className="flex h-10 flex-1 items-center gap-[3px]" aria-hidden="true">
            {Array.from({ length: BARS }, (_, i) => {
              const h = 18 + Math.abs(Math.sin(i * 1.7) * 60 + Math.sin(i * 0.43) * 22)
              return (
                <span
                  key={i}
                  className={`flex-1 rounded-full transition-colors duration-300 ${i / BARS < progress ? 'bg-crimson' : 'bg-ivory/20'}`}
                  style={{ height: `${Math.min(h, 100)}%` }}
                />
              )
            })}
          </div>
        </div>
      )}

      <div className="mt-3 flex items-baseline justify-between gap-4 font-ui text-[0.68rem] tracking-[0.2em] text-ivory/50 uppercase">
        <span>{media.title}</span>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={transcriptId}
          className="shrink-0 underline decoration-ivory/20 underline-offset-4 hover:text-crimson"
        >
          {open ? 'Hide transcript' : 'Transcript'}
        </button>
      </div>
      <div id={transcriptId} hidden={!open} className="mt-4 space-y-2 border-l border-blood/60 pl-4 font-story text-lg text-ivory/75 [&_em]:text-ivory/50 [&_p]:!indent-0">
        {media.transcript.map((line, i) => (
          <p key={i}>
            <Inline text={line} />
          </p>
        ))}
      </div>
      {media.credit && <p className="mt-3 font-ui text-[0.65rem] text-ivory/35">{media.credit}</p>}
    </div>
  )
}
