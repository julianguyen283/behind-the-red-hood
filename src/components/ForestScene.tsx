import { useMemo } from 'react'

/** Deterministic PRNG so the forest is identical on every render/build. */
function rng(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const W = 1600
const H = 900

/** One bare, slightly crooked tree: tapered trunk plus a few tapered limbs. */
function treePath(r: () => number, x: number, base: number, width: number, height: number) {
  const lean = (r() - 0.5) * width * 0.9
  const top = base - height
  const tw = width * 0.18
  const parts: string[] = []
  parts.push(
    `M${x - width / 2},${base + 40} C${x - width * 0.45},${base - height * 0.4} ${x - tw + lean * 0.6},${top + height * 0.3} ${x - tw + lean},${top} L${x + tw + lean},${top} C${x + tw + lean * 0.6},${top + height * 0.3} ${x + width * 0.45},${base - height * 0.4} ${x + width / 2},${base + 40} Z`,
  )
  const limbs = 3 + Math.floor(r() * 5)
  for (let i = 0; i < limbs; i++) {
    const t = 0.3 + r() * 0.62 // height along trunk
    const y = base - height * t
    const cx = x + lean * t
    const dir = r() > 0.5 ? 1 : -1
    const len = width * (1.6 + r() * 3.2) * (1.1 - t * 0.5)
    const rise = len * (0.25 + r() * 0.7)
    const thick = width * (0.09 + r() * 0.08) * (1.1 - t * 0.6)
    const ex = cx + dir * len
    const ey = y - rise
    parts.push(
      `M${cx},${y - thick} Q${cx + dir * len * 0.5},${y - rise * 0.35 - thick} ${ex},${ey} Q${cx + dir * len * 0.5},${y - rise * 0.35 + thick} ${cx},${y + thick * 2} Z`,
    )
    // small twig off the limb
    if (r() > 0.4) {
      const mx = cx + dir * len * 0.6
      const my = y - rise * 0.5
      parts.push(`M${mx},${my} L${mx + dir * len * 0.35},${my - len * 0.45} L${mx + dir * 2},${my + 2} Z`)
    }
  }
  return parts.join(' ')
}

type Layer = { d: string; fill: string }

function buildForest(): Layer[] {
  const r = rng(1050)
  const specs = [
    { count: 26, w: [10, 18], h: [520, 700], base: 600, fill: 'var(--color-forest-1)' },
    { count: 18, w: [18, 30], h: [600, 820], base: 660, fill: 'var(--color-forest-2)' },
    { count: 12, w: [30, 52], h: [760, 980], base: 760, fill: 'var(--color-forest-3)' },
    { count: 7, w: [60, 110], h: [1000, 1200], base: 930, fill: 'var(--color-forest-4)' },
  ]
  return specs.map((s, li) => {
    const paths: string[] = []
    for (let i = 0; i < s.count; i++) {
      let x = (i / s.count) * W + r() * (W / s.count)
      // keep the path to the light clear, more so for near layers
      const clear = 90 + li * 110
      if (Math.abs(x - W / 2) < clear) x += x < W / 2 ? -clear : clear
      const w = s.w[0] + r() * (s.w[1] - s.w[0])
      const h = s.h[0] + r() * (s.h[1] - s.h[0])
      paths.push(treePath(r, x, s.base + r() * 30, w, h))
    }
    return { d: paths.join(' '), fill: s.fill }
  })
}

const stop = (color: string, opacity = 1) => ({ stopColor: `var(--color-${color})`, stopOpacity: opacity })

/** Static forest at dusk: one cold light source at the end of the path, low mist. */
export function ForestScene() {
  const layers = useMemo(buildForest, [])
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={stop('void')} />
            <stop offset="0.6" style={stop('forest-sky')} />
            <stop offset="1" style={stop('void')} />
          </linearGradient>
          <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" style={stop('forest-light', 0.22)} />
            <stop offset="0.4" style={stop('forest-light', 0.07)} />
            <stop offset="1" style={stop('forest-light', 0)} />
          </radialGradient>
          <linearGradient id="path" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={stop('forest-path', 0.6)} />
            <stop offset="1" style={stop('forest-2', 0.9)} />
          </linearGradient>
          <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={stop('void', 0)} />
            <stop offset="0.45" style={stop('void', 0.8)} />
            <stop offset="1" style={stop('mood-forest')} />
          </linearGradient>
        </defs>

        <rect width={W} height={H} fill="url(#sky)" />
        <ellipse cx={W / 2} cy={560} rx={520} ry={300} fill="url(#glow)" />
        <path d={`M${W / 2 - 18},590 L${W / 2 + 18},590 L${W / 2 + 380},${H} L${W / 2 - 380},${H} Z`} fill="url(#path)" />
        {layers.map((layer, i) => (
          <path key={i} d={layer.d} style={{ fill: layer.fill }} />
        ))}
        <rect y={H * 0.55} width={W} height={H * 0.45} fill="url(#ground)" />
      </svg>

      <div className="fog-layer top-[50%] h-[30%]" style={{ animationDuration: '60s' }} />
      <div className="fog-layer top-[64%] h-[34%] opacity-80" style={{ animationDuration: '80s', animationDelay: '-30s' }} />
    </div>
  )
}
