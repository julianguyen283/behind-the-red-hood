import { useRef, useState } from 'react'
import { storyMedia, type ImageMedia, type VideoMedia } from '../content/media'
import { AudioPlayer } from './AudioPlayer'
import { MediaPlaceholder } from './MediaPlaceholder'
import { Reveal } from './Reveal'
import { VideoPlayer } from './VideoPlayer'

function Caption({ caption, credit }: { caption?: string; credit?: string }) {
  if (!caption && !credit) return null
  return (
    <figcaption className="mx-auto mt-5 max-w-[34rem] px-4 text-center">
      {caption && <span className="block font-story text-base text-ivory/65 italic">{caption}</span>}
      {credit && <span className="mt-2 block font-ui text-[0.62rem] tracking-[0.12em] text-ivory/35">{credit}</span>}
    </figcaption>
  )
}

function StoryImage({ media }: { media: ImageMedia }) {
  const [missing, setMissing] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)
  if (missing) return <MediaPlaceholder kind="image" note={media.placeholderNote} aspect={media.aspect} />

  const image = (
    <>
      <img src={media.src} alt={media.alt} loading="lazy" decoding="async" onError={() => setMissing(true)} className="h-full w-full object-cover" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 shadow-[inset_0_0_100px_30px_color-mix(in_srgb,var(--color-void)_70%,transparent)]" />
    </>
  )
  if (!media.enlarge) {
    return (
      <div className="relative overflow-hidden bg-charcoal" style={{ aspectRatio: media.aspect }}>
        {image}
      </div>
    )
  }
  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className="group relative block w-full cursor-zoom-in overflow-hidden bg-charcoal"
        style={{ aspectRatio: media.aspect }}
        aria-label="Enlarge illustration"
      >
        {image}
        <span className="absolute right-3 bottom-3 font-ui text-[0.6rem] tracking-[0.3em] text-ivory/60 uppercase opacity-80 transition-opacity group-hover:opacity-100 md:opacity-0 md:group-focus-visible:opacity-100">
          Enlarge
        </span>
      </button>
      {/* native <dialog>: focus is trapped and Esc closes it */}
      <dialog
        ref={dialog}
        onClick={(e) => e.target === e.currentTarget && dialog.current?.close()}
        className="m-auto max-h-none max-w-none bg-transparent p-0 backdrop:bg-[rgb(8_8_11/0.96)]"
      >
        <div className="relative flex h-[100svh] w-screen items-center justify-center p-4 md:p-10">
          <img src={media.src} alt={media.alt} className="max-h-full max-w-full object-contain" />
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            autoFocus
            className="absolute top-4 right-4 border border-ivory/30 bg-void/60 px-4 py-2 font-ui text-[0.62rem] tracking-[0.3em] text-ivory uppercase hover:border-crimson"
          >
            Close
          </button>
        </div>
      </dialog>
    </>
  )
}

function StoryVideo({ media }: { media: VideoMedia }) {
  return (
    <>
      <VideoPlayer {...media} mode="loop" />
      {media.description && (
        <p className="mx-auto mt-4 max-w-[34rem] px-4 text-center font-ui text-[0.7rem] leading-relaxed text-ivory/45">
          <span className="sr-only">Video description: </span>
          {media.description}
        </p>
      )}
    </>
  )
}

const width: Record<string, string> = {
  image: 'max-w-4xl',
  video: 'max-w-6xl',
  audio: 'max-w-[38rem]',
}

/** A story media block, breaking out of the text column at a turning point. */
export function StoryMedia({ id }: { id: string }) {
  const media = storyMedia[id]
  if (!media) {
    if (import.meta.env.DEV) console.warn(`[story] No media configured for "${id}" — add it in src/content/media.ts`)
    return null
  }
  return (
    <Reveal as="figure" rise={28} className={`mx-auto my-20 w-full md:my-32 ${width[media.kind]}`}>
      {media.kind === 'image' && <StoryImage media={media} />}
      {media.kind === 'video' && <StoryVideo media={media} />}
      {media.kind === 'audio' && <AudioPlayer media={media} />}
      {media.kind !== 'audio' && <Caption caption={media.caption} credit={media.credit} />}
    </Reveal>
  )
}
