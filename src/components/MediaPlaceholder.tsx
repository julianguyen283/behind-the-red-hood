import type { ReactNode } from 'react'

type Props = {
  kind: 'video' | 'image' | 'audio'
  note: string
  aspect?: string
  children?: ReactNode
}

const label = { video: 'Video placeholder', image: 'Illustration placeholder', audio: 'Audio placeholder' }

/**
 * Shown whenever a media file has not been supplied yet. It is deliberately
 * labelled as a placeholder so it can never be mistaken for final media.
 */
export function MediaPlaceholder({ kind, note, aspect, children }: Props) {
  return (
    <div
      role="img"
      aria-label={`${label[kind]}: ${note}`}
      className="placeholder-stripes relative flex w-full flex-col items-center justify-center gap-4 overflow-hidden border border-ivory/10 bg-charcoal/70 px-6 py-10 text-center"
      style={aspect ? { aspectRatio: aspect } : undefined}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_120%,color-mix(in_srgb,var(--color-blood)_22%,transparent),transparent_60%)]" />
      <span className="relative font-ui text-[0.62rem] tracking-[0.34em] text-crimson uppercase">{label[kind]}</span>
      <span className="relative max-w-md font-ui text-xs leading-relaxed text-ivory/55">{note}</span>
      {children && <div className="relative mt-2 w-full">{children}</div>}
    </div>
  )
}
