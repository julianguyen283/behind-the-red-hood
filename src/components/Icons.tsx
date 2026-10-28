import type { SVGProps } from 'react'

const base = (p: SVGProps<SVGSVGElement>) => ({
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.4,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  ...p,
})

export const PlayIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M7 4.5v15l12-7.5z" fill="currentColor" stroke="none" /></svg>
)
export const PauseIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M8 5v14M16 5v14" strokeWidth={2.2} /></svg>
)
export const SoundOnIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" /><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" /></svg>
)
export const SoundOffIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" /><path d="M16 9.5l5 5M21 9.5l-5 5" /></svg>
)
export const CaptionsIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}><rect x="3" y="5.5" width="18" height="13" rx="1.5" /><path d="M10.5 10.2a2.4 2.4 0 1 0 0 3.6M17 10.2a2.4 2.4 0 1 0 0 3.6" /></svg>
)

/** Small, quiet glyphs for the three questions. Decorative + labelled for AT. */
export const SenseGlyph = ({ sense }: { sense: 'ears' | 'eyes' | 'teeth' }) => (
  <svg width="44" height="28" viewBox="0 0 44 28" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
    {sense === 'ears' && (
      <path d="M17 22c-3-1-4-4-4-8a9 9 0 0 1 18 0c0 4-3 5-4.5 7.5S24 26 21 25M18 14a4 4 0 0 1 8 0c0 2-2 2.5-2 4.5" />
    )}
    {sense === 'eyes' && (
      <>
        <path d="M6 14c5-7 27-7 32 0-5 7-27 7-32 0z" />
        <circle cx="22" cy="14" r="4" />
        <circle cx="22" cy="14" r="1.2" fill="currentColor" />
      </>
    )}
    {sense === 'teeth' && <path d="M6 8c10 4 22 4 32 0M9 9.2l2.5 9 2.5-8.2M17 10.4l2.5 11 2.5-11M25 10.4l2.5 9 2.5-9.6M33 9.2l-1.5 6" />}
  </svg>
)
