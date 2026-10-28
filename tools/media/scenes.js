/*
  Behind the Red Hood — procedural scenes, painted on a 2D canvas.
  Loaded by render.html; driven frame by frame by render.cjs.

  Scenes:
    intro(ctx, W, H, t)   0–44.5 s  forest walk → cottage → door → knock → door opens
    room(ctx, W, H, t)    0–10 s    the bedroom behind Red (Video 2)
    bedroom(ctx, W, H)              Illustration 1
    thorns(ctx, W, H)               Illustration 2
*/

// ── helpers ─────────────────────────────────────────────────────────────
const rngOf = (seed) => () => {
  seed |= 0
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const lerp = (a, b, t) => a + (b - a) * t
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x))
const smooth = (e0, e1, x) => {
  const t = clamp((x - e0) / (e1 - e0))
  return t * t * (3 - 2 * t)
}
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t)
const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`

let noiseTile
function noise() {
  if (noiseTile) return noiseTile
  noiseTile = document.createElement('canvas')
  noiseTile.width = noiseTile.height = 256
  const c = noiseTile.getContext('2d')
  const img = c.createImageData(256, 256)
  const r = rngOf(7)
  for (let i = 0; i < img.data.length; i += 4) {
    const v = (r() * 255) | 0
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v
    img.data[i + 3] = 255
  }
  c.putImageData(img, 0, 0)
  return noiseTile
}
function grain(ctx, W, H, alpha, seed = 0) {
  const r = rngOf(seed + 1)
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.globalCompositeOperation = 'overlay'
  ctx.translate(-r() * 256, -r() * 256)
  ctx.fillStyle = ctx.createPattern(noise(), 'repeat')
  ctx.fillRect(0, 0, W + 256, H + 256)
  ctx.restore()
}
function vignette(ctx, W, H, strength = 0.7, inner = 0.35) {
  const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * inner, W / 2, H / 2, Math.hypot(W, H) * 0.55)
  g.addColorStop(0, 'rgba(0,0,0,0)')
  g.addColorStop(1, `rgba(0,0,0,${strength})`)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
}
function glow(ctx, x, y, r, color, alpha) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r)
  g.addColorStop(0, rgb(color, alpha))
  g.addColorStop(1, rgb(color, 0))
  ctx.fillStyle = g
  ctx.fillRect(x - r, y - r, r * 2, r * 2)
}
function poly(ctx, pts, fill) {
  ctx.beginPath()
  ctx.moveTo(pts[0][0], pts[0][1])
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1])
  ctx.closePath()
  ctx.fillStyle = fill
  ctx.fill()
}
/** A slightly wobbly ink line, for the illustrations. */
function inkLine(ctx, pts, width, color, r, wobble = 1.2) {
  ctx.beginPath()
  ctx.moveTo(pts[0][0] + (r() - 0.5) * wobble, pts[0][1] + (r() - 0.5) * wobble)
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1]
    const [x1, y1] = pts[i]
    const steps = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / 40))
    for (let s = 1; s <= steps; s++) {
      const k = s / steps
      ctx.lineTo(lerp(x0, x1, k) + (r() - 0.5) * wobble, lerp(y0, y1, k) + (r() - 0.5) * wobble)
    }
  }
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.stroke()
}
let mistTex
function mistTexture() {
  if (mistTex) return mistTex
  mistTex = document.createElement('canvas')
  mistTex.width = 2048
  mistTex.height = 512
  const c = mistTex.getContext('2d')
  const r = rngOf(31)
  c.filter = 'blur(30px)'
  for (let i = 0; i < 80; i++) {
    c.fillStyle = `rgba(210,215,222,${0.05 + r() * 0.07})`
    c.beginPath()
    c.ellipse(r() * 2048, 256 + (r() - 0.5) * 80, 80 + r() * 260, 16 + r() * 34, 0, 0, Math.PI * 2)
    c.fill()
  }
  return mistTex
}
function mistBand(ctx, W, y, h, alpha, offset) {
  const tex = mistTexture()
  ctx.save()
  ctx.globalAlpha = alpha
  const x = -((offset % 2048) + 2048) % 2048
  for (let k = 0; k < 3; k++) ctx.drawImage(tex, x + k * 2048 * (W / 1400), y - h, 2048 * (W / 1400), h * 2)
  ctx.restore()
}

// ── opening film ────────────────────────────────────────────────────────
const FOG = [62, 67, 74]
const NEAR = [9, 10, 12]
const forest = (() => {
  const r = rngOf(1050)
  const trees = []
  const add = (x, z) => {
    const H = 11 + r() * 7
    const canopyBase = 2.6 + r() * 2.2
    const pts = []
    const tiers = 9 + Math.floor(r() * 4)
    for (let k = 0; k <= tiers; k++) {
      const h = H - (H - canopyBase) * (k / tiers)
      const w = (H - h) * (0.26 + r() * 0.08) + 0.15
      pts.push([w * (k % 2 ? 0.72 : 1), h - (k % 2 ? 0 : 0.35)])
    }
    const left = pts.map(([w, h]) => [-w * (0.9 + r() * 0.2), h])
    const right = pts.map(([w, h]) => [w * (0.9 + r() * 0.2), h]).reverse()
    const twigs = []
    for (let k = 0; k < 4; k++) twigs.push({ h: 1.6 + r() * (canopyBase - 1.6), len: 0.5 + r() * 1.2, dir: r() > 0.5 ? 1 : -1, rise: 0.2 + r() * 0.6 })
    trees.push({ x, z, w: 0.16 + r() * 0.22, H, canopy: [[0, H + 0.4], ...right, ...left], canopyBase, twigs })
  }
  for (let i = 0; i < 420; i++) {
    const z = 1 + r() * 75
    const side = r() > 0.5 ? 1 : -1
    let x = side * (1.7 + Math.pow(r(), 0.8) * 22)
    if (z > 36 && Math.abs(x) < 10) continue // the clearing round the cottage
    add(x, z)
  }
  const leaves = []
  for (let i = 0; i < 900; i++) leaves.push({ x: (r() - 0.5) * 12, z: r() * 30, s: 0.03 + r() * 0.05, c: r() })
  return { trees, leaves }
})()

// camera distance travelled: steady walk, slowing near the cottage
const camZ = (() => {
  const table = [0]
  const v = (t) => (t < 14 ? 1.15 : lerp(1.15, 0.7, smooth(14, 23, t)))
  for (let i = 1; i <= 2600; i++) table.push(table[i - 1] + v(i / 100) * 0.01)
  return (t) => table[Math.min(2600, Math.max(0, Math.round(t * 100)))]
})()

function walk(ctx, W, H, t) {
  const zc = camZ(t)
  const f = W * 0.62
  const bob = 3.5 * Math.sin((2 * Math.PI * zc) / 0.72)
  const camX = 0.05 * Math.sin((Math.PI * zc) / 0.72) + 0.02 * Math.sin(t * 0.7)
  const hy = H * 0.5 + bob
  const camH = 1.55
  const P = (x, h, d) => [W / 2 + ((x - camX) / d) * f, hy - ((h - camH) / d) * f]

  // dusk sky and distant glow
  const sky = ctx.createLinearGradient(0, 0, 0, hy)
  sky.addColorStop(0, rgb([16, 18, 22]))
  sky.addColorStop(1, rgb([78, 83, 90]))
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, W, hy + 2)
  const ground = ctx.createLinearGradient(0, hy, 0, H)
  ground.addColorStop(0, rgb([46, 48, 52]))
  ground.addColorStop(0.25, rgb([22, 22, 24]))
  ground.addColorStop(1, rgb([11, 11, 12]))
  ctx.fillStyle = ground
  ctx.fillRect(0, hy, W, H - hy)

  // the path, narrowing to the light
  const pw = 0.75
  const near = 0.8
  const pg = ctx.createLinearGradient(0, hy, 0, H)
  pg.addColorStop(0, rgb([58, 60, 64], 0.9))
  pg.addColorStop(0.3, rgb([36, 35, 35], 0.85))
  pg.addColorStop(1, rgb([26, 24, 23], 0.8))
  ctx.save()
  ctx.filter = 'blur(6px)'
  poly(ctx, [P(-pw, 0, near), P(pw, 0, near), P(pw * 0.6, 0, 60), P(-pw * 0.6, 0, 60)], pg)
  ctx.restore()
  // leaves on the ground (parallax)
  for (const l of forest.leaves) {
    const d = ((l.z - (zc % 30) + 30) % 30) + 0.5
    if (d < 0.6) continue
    const [x, y] = P(l.x, 0, d)
    const s = (l.s / d) * f
    ctx.fillStyle = rgb(mix(mix([58, 50, 44], [30, 28, 28], l.c), FOG, 1 - Math.exp(-d / 16)), 0.9)
    ctx.beginPath()
    ctx.ellipse(x, y, s * 1.6, s * 0.55, l.c * 3, 0, Math.PI * 2)
    ctx.fill()
  }

  // everything with depth, far to near
  const items = []
  for (const tr of forest.trees) {
    const d = tr.z - zc
    if (d > 0.35 && d < 70) items.push({ d, draw: () => drawPine(tr, d) })
  }
  const cz = 49 - zc
  const emerge = 1 - smooth(22, 34, cz)
  if (emerge > 0) {
    items.push({ d: cz + 4, draw: () => ((ctx.globalAlpha = emerge), drawOaks(cz + 4), (ctx.globalAlpha = 1)) })
    items.push({ d: cz, draw: () => ((ctx.globalAlpha = emerge), drawCottage(cz), (ctx.globalAlpha = 1)) })
  }
  const bz = 13.4 - zc // the branch across the path
  if (bz > 0.25 && bz < 40) items.push({ d: bz, draw: () => drawBranch(bz) })
  items.sort((a, b) => b.d - a.d)

  function tone(d) {
    return mix(NEAR, FOG, 1 - Math.exp(-d / 13))
  }
  function drawPine(tr, d) {
    const c = tone(d)
    const [bx, by] = P(tr.x, 0, d)
    const [, ty] = P(tr.x, tr.H, d)
    const w = (tr.w / d) * f
    poly(ctx, [[bx - w / 2, by], [bx + w / 2, by], [bx + w * 0.15, ty], [bx - w * 0.15, ty]], rgb(c))
    ctx.strokeStyle = rgb(c)
    ctx.lineWidth = Math.max(0.6, w * 0.18)
    for (const tw of tr.twigs) {
      const [x0, y0] = P(tr.x, tw.h, d)
      const [x1, y1] = P(tr.x + tw.dir * tw.len, tw.h + tw.rise, d)
      ctx.beginPath()
      ctx.moveTo(x0, y0)
      ctx.lineTo(x1, y1)
      ctx.stroke()
    }
    ctx.beginPath()
    tr.canopy.forEach(([dx, h], i) => {
      const [x, y] = P(tr.x + dx, h, d)
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
    })
    ctx.closePath()
    ctx.fillStyle = rgb(c)
    ctx.fill()
  }
  function drawOaks(d) {
    if (d < 1) return
    const c = tone(d * 0.9)
    for (const [x, h, rad] of [[-5.5, 7.5, 4.2], [0.8, 9, 5], [6.8, 7.8, 4.4]]) {
      const [bx, by] = P(x, 0, d)
      const [, ty] = P(x, h - 2, d)
      const w = (0.9 / d) * f
      poly(ctx, [[bx - w / 2, by], [bx + w / 2, by], [bx + w / 4, ty], [bx - w / 4, ty]], rgb(c))
      const r = rngOf(Math.round(x * 10) + 99)
      ctx.fillStyle = rgb(c)
      for (let k = 0; k < 14; k++) {
        const [cx, cy] = P(x + (r() - 0.5) * rad * 1.6, h + (r() - 0.3) * rad * 0.7, d)
        ctx.beginPath()
        ctx.ellipse(cx, cy, ((rad * (0.35 + r() * 0.3)) / d) * f, ((rad * (0.25 + r() * 0.2)) / d) * f, 0, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }
  function drawCottage(d) {
    if (d < 1) return
    const c = mix(tone(d * 0.85), [60, 60, 64], 0.15)
    const x0 = 0.4
    const wall = [P(x0 - 3, 0, d), P(x0 + 3, 0, d), P(x0 + 3, 2.5, d), P(x0 - 3, 2.5, d)]
    poly(ctx, wall, rgb(c))
    poly(ctx, [P(x0 - 3.5, 2.4, d), P(x0 + 3.5, 2.4, d), P(x0, 5.2, d)], rgb(mix(c, NEAR, 0.25)))
    poly(ctx, [P(x0 + 1.5, 3.4, d), P(x0 + 2.2, 3.4, d), P(x0 + 2.2, 5.6, d), P(x0 + 1.5, 5.6, d)], rgb(mix(c, NEAR, 0.2)))
    const dark = rgb(mix(c, NEAR, 0.55))
    for (const wx of [-2.0, 1.6]) poly(ctx, [P(x0 + wx - 0.45, 1.0, d), P(x0 + wx + 0.45, 1.0, d), P(x0 + wx + 0.45, 1.8, d), P(x0 + wx - 0.45, 1.8, d)], dark)
    poly(ctx, [P(x0 - 0.5, 0, d), P(x0 + 0.5, 0, d), P(x0 + 0.5, 1.9, d), P(x0 - 0.5, 1.9, d)], dark)
  }
  function drawBranch(d) {
    const c = tone(d)
    ctx.strokeStyle = rgb(c)
    ctx.lineCap = 'round'
    const pts = [[-4.2, 1.95], [-2.4, 1.86], [-0.8, 1.9], [0.6, 1.98], [1.6, 2.1]].map(([x, h]) => P(x, h, d))
    for (let i = 1; i < pts.length; i++) {
      ctx.lineWidth = Math.max(1, ((0.11 - i * 0.017) / d) * f)
      ctx.beginPath()
      ctx.moveTo(pts[i - 1][0], pts[i - 1][1])
      ctx.lineTo(pts[i][0], pts[i][1])
      ctx.stroke()
    }
    ctx.lineWidth = Math.max(0.8, (0.025 / d) * f)
    for (const [x, h, dx, dh] of [[-2.6, 1.86, 0.3, -0.45], [-1.2, 1.88, -0.2, -0.35], [0.2, 1.95, 0.35, -0.3], [-3.4, 1.9, -0.1, 0.4]]) {
      const [a, b] = P(x, h, d)
      const [e, g] = P(x + dx, h + dh, d)
      ctx.beginPath()
      ctx.moveTo(a, b)
      ctx.lineTo(e, g)
      ctx.stroke()
    }
  }

  // fog between the depths
  mistBand(ctx, W, hy - 10, H * 0.32, 0.9, t * 9)
  for (const it of items) {
    it.draw()
  }
  mistBand(ctx, W, hy + H * 0.12, H * 0.28, 0.55, -t * 14 + 600)
  mistBand(ctx, W, H * 0.93, H * 0.3, 0.35, t * 20 + 1200)

  // the basket at the bottom edge of the frame
  const bb = Math.sin((2 * Math.PI * zc) / 0.72 + 1.2) * 5
  const bx = W * 0.8
  const by = H + 18 + bb
  ctx.save()
  ctx.translate(bx, by)
  ctx.rotate(-0.06 + 0.01 * Math.sin(zc * 4))
  ctx.strokeStyle = rgb([34, 27, 22])
  ctx.lineWidth = W * 0.012
  ctx.beginPath()
  ctx.ellipse(0, -H * 0.02, W * 0.13, H * 0.2, 0, Math.PI * 1.08, Math.PI * 1.92)
  ctx.stroke()
  ctx.fillStyle = rgb([30, 24, 20])
  ctx.beginPath()
  ctx.ellipse(0, 0, W * 0.15, H * 0.06, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = rgb([92, 88, 82])
  ctx.beginPath()
  ctx.ellipse(-W * 0.02, -H * 0.012, W * 0.11, H * 0.035, -0.05, Math.PI, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = rgb([20, 16, 14], 0.8)
  ctx.lineWidth = 2
  for (let k = -6; k <= 6; k++) {
    ctx.beginPath()
    ctx.moveTo(k * W * 0.022, -H * 0.005)
    ctx.lineTo(k * W * 0.024, H * 0.06)
    ctx.stroke()
  }
  ctx.restore()
}

// the cottage door, close
const doorTex = (() => {
  let c
  return (W, H) => {
    if (c && c.width === Math.round(W * 0.34)) return c
    c = document.createElement('canvas')
    c.width = Math.round(W * 0.34)
    c.height = Math.round(H * 1.0)
    const g = c.getContext('2d')
    const r = rngOf(55)
    const planks = 5
    const pw = c.width / planks
    for (let i = 0; i < planks; i++) {
      const base = [40 + r() * 10, 34 + r() * 8, 30 + r() * 6]
      g.fillStyle = rgb(base)
      g.fillRect(i * pw, 0, pw, c.height)
      g.strokeStyle = rgb(mix(base, [20, 16, 14], 0.5), 0.55)
      for (let k = 0; k < 16; k++) {
        g.lineWidth = 0.6 + r() * 1.4
        g.beginPath()
        const x = i * pw + r() * pw
        g.moveTo(x, 0)
        for (let y = 0; y <= c.height; y += 40) g.lineTo(x + Math.sin(y * 0.01 + k) * 3 + (r() - 0.5) * 2, y)
        g.stroke()
      }
      g.fillStyle = rgb([12, 10, 9])
      g.fillRect(i * pw - 2, 0, 4, c.height)
    }
    // iron strap hinges on the left, ring on the right
    g.fillStyle = rgb([24, 24, 26])
    for (const y of [0.16, 0.78]) {
      g.fillRect(0, c.height * y, c.width * 0.62, c.height * 0.028)
      for (let k = 0; k < 4; k++) {
        g.beginPath()
        g.arc(c.width * (0.08 + k * 0.15), c.height * (y + 0.014), 4, 0, Math.PI * 2)
        g.fillStyle = rgb([60, 60, 62])
        g.fill()
        g.fillStyle = rgb([24, 24, 26])
      }
    }
    g.strokeStyle = rgb([30, 30, 32])
    g.lineWidth = 7
    g.beginPath()
    g.arc(c.width * 0.84, c.height * 0.53, c.width * 0.05, 0, Math.PI * 2)
    g.stroke()
    // weathering
    g.globalAlpha = 0.18
    g.globalCompositeOperation = 'multiply'
    g.fillStyle = g.createPattern(noise(), 'repeat')
    g.fillRect(0, 0, c.width, c.height)
    return c
  }
})()
const stones = (() => {
  const r = rngOf(77)
  const s = []
  for (let row = 0; row < 18; row++) {
    let x = -0.05 - r() * 0.05
    while (x < 1.05) {
      const w = 0.05 + r() * 0.07
      s.push({ x, y: row / 16 - 0.05, w, h: 1 / 16 - 0.006, c: 40 + r() * 22 })
      x += w + 0.006
    }
  }
  return s
})()

function door(ctx, W, H, t) {
  const tt = t - 24
  const push = lerp(0.9, 1, smooth(0, 2.5, tt)) + 0.05 * smooth(13.5, 20, tt)
  const knockShake = [8.6, 9.7].reduce((a, k) => a + Math.exp(-Math.pow((tt - k) * 12, 2)) * 3, 0)
  const sx = Math.sin(t * 0.9) * 3 + Math.sin(t * 2.3) * 1.2
  const sy = Math.sin(t * 1.3) * 2 + knockShake
  ctx.save()
  ctx.translate(W / 2 + sx, H / 2 + sy)
  ctx.scale(push, push)
  ctx.translate(-W / 2, -H / 2)
  // stone wall in cold dusk light
  ctx.fillStyle = rgb([16, 17, 19])
  ctx.fillRect(-W * 0.1, -H * 0.1, W * 1.2, H * 1.2)
  for (const s of stones) {
    const lit = 1 - 0.5 * s.x
    ctx.fillStyle = rgb([s.c * lit * 0.9, s.c * lit * 0.95, s.c * lit])
    ctx.beginPath()
    ctx.roundRect(s.x * W, s.y * H, s.w * W, s.h * H, 6)
    ctx.fill()
  }
  const dx0 = W * 0.33
  const dy0 = H * 0.06
  const tex = doorTex(W, H)
  const dw = tex.width
  const dh = H * 1.0
  // the doorway: darkness
  ctx.fillStyle = rgb([3, 3, 4])
  ctx.fillRect(dx0, dy0, dw, dh)
  // threshold, faintly lit
  const th = ctx.createLinearGradient(0, dy0 + dh * 0.86, 0, dy0 + dh)
  th.addColorStop(0, 'rgba(40,40,44,0)')
  th.addColorStop(1, 'rgba(40,40,44,0.5)')

  // the door swings inward by itself
  const a = smooth(36.4, 43.2, t) * 1.3
  const s = 1 / (1 + 0.42 * Math.sin(a))
  const width = Math.cos(a) * dw
  const cy = dy0 + dh / 2
  const strips = 80
  for (let i = 0; i < strips; i++) {
    const u0 = i / strips
    const u1 = (i + 1) / strips
    const k0 = lerp(1, s, u0)
    const k1 = lerp(1, s, u1)
    const x0 = dx0 + width * u0
    const x1 = dx0 + width * u1
    const h0 = dh * k0
    ctx.drawImage(tex, u0 * tex.width, 0, tex.width / strips + 1, tex.height, x0, cy - h0 / 2, x1 - x0 + 0.8, dh * (k0 + k1) / 2)
  }
  if (a > 0) {
    ctx.fillStyle = rgb([0, 0, 0], 0.55 * Math.sin(a))
    poly(ctx, [[dx0, dy0], [dx0 + width, cy - (dh * s) / 2], [dx0 + width, cy + (dh * s) / 2], [dx0, dy0 + dh]], rgb([0, 0, 0], 0.6 * Math.sin(a)))
  }
  ctx.fillStyle = th
  ctx.fillRect(dx0, dy0 + dh * 0.86, dw, dh * 0.14)
  // door frame
  ctx.fillStyle = rgb([28, 26, 25])
  ctx.fillRect(dx0 - W * 0.03, dy0 - H * 0.04, W * 0.03, dh + H * 0.1)
  ctx.fillRect(dx0 + dw, dy0 - H * 0.04, W * 0.03, dh + H * 0.1)
  ctx.fillRect(dx0 - W * 0.03, dy0 - H * 0.06, dw + W * 0.06, H * 0.05)

  // cold light from the upper left
  const light = ctx.createLinearGradient(0, 0, W, H)
  light.addColorStop(0, 'rgba(170,180,195,0.10)')
  light.addColorStop(0.6, 'rgba(0,0,0,0)')
  light.addColorStop(1, 'rgba(0,0,0,0.35)')
  ctx.fillStyle = light
  ctx.fillRect(-W * 0.1, -H * 0.1, W * 1.2, H * 1.2)

  // a hand knocks, twice
  for (const k of [32.6, 33.7]) {
    const p = Math.exp(-Math.pow((t - k) / 0.32, 2))
    if (p < 0.01) continue
    const hx = lerp(W * 1.1, W * 0.66, p)
    const hy2 = lerp(H * 1.2, H * 0.58, p)
    ctx.save()
    ctx.translate(hx, hy2)
    ctx.rotate(-0.35)
    const u = W * 0.045
    // sleeve, dark wool with the faintest red
    ctx.fillStyle = rgb([30, 20, 22])
    ctx.beginPath()
    ctx.moveTo(u * 1.1, -u * 1.25)
    ctx.lineTo(u * 7, -u * 1.9)
    ctx.lineTo(u * 7, u * 2.2)
    ctx.lineTo(u * 1.1, u * 1.35)
    ctx.closePath()
    ctx.fill()
    // the fist: back of the hand, four knuckles, the thumb folded underneath
    const skin = [128, 114, 106]
    ctx.fillStyle = rgb(skin)
    ctx.beginPath()
    ctx.roundRect(-u * 1.2, -u * 1.3, u * 2.6, u * 2.6, u * 0.8)
    ctx.fill()
    for (let j = 0; j < 4; j++) {
      ctx.fillStyle = rgb(mix(skin, [150, 136, 126], 0.6))
      ctx.beginPath()
      ctx.ellipse(-u * 1.15, -u * 0.95 + j * u * 0.64, u * 0.42, u * 0.33, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = rgb([70, 60, 56], 0.7)
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(-u * 1.3, -u * 0.66 + j * u * 0.64)
      ctx.lineTo(-u * 0.4, -u * 0.62 + j * u * 0.64)
      ctx.stroke()
    }
    ctx.fillStyle = rgb(mix(skin, [70, 60, 56], 0.3))
    ctx.beginPath()
    ctx.ellipse(-u * 0.1, u * 1.15, u * 0.9, u * 0.38, -0.2, 0, Math.PI * 2)
    ctx.fill()
    // shadow side away from the light
    const sh = ctx.createLinearGradient(-u, 0, u * 1.4, 0)
    sh.addColorStop(0, 'rgba(0,0,0,0)')
    sh.addColorStop(1, 'rgba(0,0,0,0.45)')
    ctx.fillStyle = sh
    ctx.fillRect(-u * 1.5, -u * 1.4, u * 3, u * 2.9)
    ctx.restore()
  }
  ctx.restore()
}

function intro(ctx, W, H, t) {
  ctx.globalAlpha = 1
  ctx.filter = 'none'
  if (t < 24) walk(ctx, W, H, t)
  else if (t < 44) door(ctx, W, H, t)
  else {
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, W, H)
    return
  }
  vignette(ctx, W, H, 0.75)
  grain(ctx, W, H, 0.09, Math.floor(t * 24))
  // dips to black at the cut and at the end
  const dip = Math.max(1 - Math.min(1, Math.abs(t - 24) / 0.35), smooth(43.3, 44, t), 1 - smooth(0, 1.2, t))
  if (dip > 0) {
    ctx.fillStyle = `rgba(0,0,0,${dip})`
    ctx.fillRect(0, 0, W, H)
  }
}

// ── Video 2: the room behind Red ────────────────────────────────────────
function room(ctx, W, H, t) {
  const pan = smooth(3.4, 6.6, t) * W * 0.55
  // one gust moves the curtain and the wardrobe door together (~6.4 s)
  const gust = smooth(0, 1.2, t) * (0.55 + 0.25 * Math.sin(t * 1.3)) + 0.6 * Math.exp(-Math.pow((t - 6.4) / 0.6, 2))
  const fire = 1 - smooth(2.0, 7.8, t) * 0.8
  const flick = 1 + 0.05 * Math.sin(t * 7.1) + 0.03 * Math.sin(t * 12.7 + 1)
  const r = rngOf(4)
  ctx.save()
  ctx.translate(-pan + Math.sin(t * 0.8) * 2, Math.sin(t * 1.1) * 1.5)
  const PW = W * 1.5
  // walls
  ctx.fillStyle = rgb([36, 28, 24])
  ctx.fillRect(-20, 0, PW + 40, H)
  ctx.globalAlpha = 0.15
  ctx.fillStyle = ctx.createPattern(noise(), 'repeat')
  ctx.globalCompositeOperation = 'multiply'
  ctx.fillRect(-20, 0, PW + 40, H)
  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = 1
  // floorboards
  const fy = H * 0.7
  ctx.fillStyle = rgb([28, 21, 17])
  ctx.fillRect(-20, fy, PW + 40, H - fy)
  ctx.strokeStyle = rgb([10, 8, 7])
  ctx.lineWidth = 2
  for (let k = -10; k < 40; k++) {
    ctx.beginPath()
    ctx.moveTo(k * W * 0.07, fy)
    ctx.lineTo(k * W * 0.11 - W * 0.2, H)
    ctx.stroke()
  }
  // the open window, low, at hip height
  const wx = W * 0.2
  const wy = H * 0.34
  const ww = W * 0.24
  const wh = H * 0.28
  const night = ctx.createLinearGradient(0, wy, 0, wy + wh)
  night.addColorStop(0, rgb([24, 34, 52]))
  night.addColorStop(1, rgb([12, 16, 24]))
  ctx.fillStyle = night
  ctx.fillRect(wx, wy, ww, wh)
  ctx.strokeStyle = rgb([8, 10, 12])
  ctx.lineWidth = 3
  for (let k = 0; k < 7; k++) {
    // brambles outside
    ctx.beginPath()
    const bx = wx + r() * ww
    ctx.moveTo(bx, wy + wh)
    ctx.quadraticCurveTo(bx + (r() - 0.5) * 80, wy + wh * 0.4, bx + (r() - 0.5) * 120, wy + wh * (0.2 + r() * 0.4))
    ctx.stroke()
  }
  ctx.fillStyle = rgb([14, 11, 10])
  ctx.fillRect(wx - 14, wy - 14, ww + 28, 14)
  ctx.fillRect(wx - 14, wy + wh, ww + 28, 18)
  ctx.fillRect(wx - 14, wy, 14, wh)
  ctx.fillRect(wx + ww, wy, 14, wh)
  // the casement leaf, swung wide
  poly(ctx, [[wx, wy], [wx - ww * 0.28, wy - wh * 0.06], [wx - ww * 0.28, wy + wh * 1.06], [wx, wy + wh]], rgb([30, 26, 24]))
  // moonlight on the floor
  ctx.fillStyle = 'rgba(120,140,170,0.06)'
  poly(ctx, [[wx, fy], [wx + ww, fy], [wx + ww * 1.8, H], [wx - ww * 0.2, H]], 'rgba(120,140,170,0.07)')

  // curtain on its rod, bellying into the room
  ctx.fillStyle = rgb([16, 12, 10])
  ctx.fillRect(wx - 30, wy - 26, ww + 60, 7)
  const cl = wx + ww * 0.42
  const cr = wx + ww + 18
  const steps = 26
  const edge = (side, v) => {
    const belly = Math.sin(v * Math.PI * 0.95) * gust * W * (side ? 0.13 : 0.09)
    const ripple = Math.sin(t * 2.6 + v * 7 + side) * 7 * gust
    return (side ? cr : cl) + belly + ripple
  }
  const cg = ctx.createLinearGradient(cl, 0, cr + W * 0.12, 0)
  cg.addColorStop(0, 'rgba(190,180,162,0.30)')
  cg.addColorStop(0.6, 'rgba(210,200,182,0.48)')
  cg.addColorStop(1, 'rgba(170,160,145,0.35)')
  ctx.fillStyle = cg
  ctx.beginPath()
  for (let i = 0; i <= steps; i++) {
    const v = i / steps
    const y = wy - 20 + v * wh * 1.18
    i ? ctx.lineTo(edge(0, v), y) : ctx.moveTo(edge(0, v), y)
  }
  for (let i = steps; i >= 0; i--) {
    const v = i / steps
    ctx.lineTo(edge(1, v), wy - 20 + v * wh * 1.18)
  }
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = 'rgba(90,80,70,0.35)'
  ctx.lineWidth = 2
  for (let k = 1; k < 5; k++) {
    ctx.beginPath()
    for (let i = 0; i <= steps; i++) {
      const v = i / steps
      const x = lerp(edge(0, v), edge(1, v), k / 5)
      const y = wy - 20 + v * wh * 1.18
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
    }
    ctx.stroke()
  }

  // the bed, its quilt dragged half onto the floor
  const bx0 = W * 0.6
  const bx1 = W * 0.9
  ctx.fillStyle = rgb([20, 15, 13])
  ctx.fillRect(bx0, H * 0.4, bx1 - bx0, H * 0.22)
  ctx.fillRect(bx0 - 6, H * 0.34, 12, fy - H * 0.34 + 6)
  ctx.fillRect(bx1 - 6, H * 0.34, 12, fy - H * 0.34 + 6)
  ctx.fillStyle = rgb([70, 64, 58])
  ctx.fillRect(bx0 + 10, H * 0.43, bx1 - bx0 - 20, H * 0.05)
  ctx.fillStyle = rgb([46, 24, 26])
  ctx.beginPath()
  ctx.moveTo(bx0 + W * 0.04, H * 0.47)
  ctx.bezierCurveTo(bx0 + W * 0.12, H * 0.45, bx0 + W * 0.2, H * 0.5, bx1 - W * 0.02, H * 0.48)
  ctx.lineTo(bx1 - W * 0.03, H * 0.6)
  ctx.bezierCurveTo(bx0 + W * 0.2, H * 0.66, bx0 + W * 0.1, H * 0.7, bx0 + W * 0.02, fy + H * 0.06)
  ctx.bezierCurveTo(bx0 - W * 0.06, fy + H * 0.08, bx0 - W * 0.1, fy + H * 0.02, bx0 - W * 0.05, fy - H * 0.01)
  ctx.bezierCurveTo(bx0 - W * 0.02, H * 0.6, bx0, H * 0.52, bx0 + W * 0.04, H * 0.47)
  ctx.fill()
  ctx.strokeStyle = 'rgba(0,0,0,0.4)'
  ctx.lineWidth = 3
  for (let k = 0; k < 4; k++) {
    ctx.beginPath()
    ctx.moveTo(bx0 + W * (0.05 + k * 0.05), H * 0.49)
    ctx.quadraticCurveTo(bx0 + W * (0.02 + k * 0.04), H * 0.6, bx0 - W * (0.02 - k * 0.02), fy + H * 0.03)
    ctx.stroke()
  }

  // the wardrobe in the corner; its door shifts a finger's width with the gust
  const ax = W * 1.06
  const ay = H * 0.08
  const aw = W * 0.2
  const ah = H * 0.7
  ctx.fillStyle = rgb([38, 27, 21])
  ctx.fillRect(ax, ay, aw, ah)
  ctx.fillStyle = rgb([16, 11, 9])
  ctx.fillRect(ax - 8, ay - 14, aw + 16, 16)
  const open = 0.16 + 0.05 * smooth(5.9, 6.7, t) - 0.015 * smooth(6.9, 7.7, t)
  ctx.fillStyle = rgb([2, 2, 2])
  ctx.fillRect(ax + aw * 0.5, ay + 6, aw * open, ah - 12)
  poly(ctx, [[ax + aw * 0.5 + aw * open, ay + 4], [ax + aw * 0.98 + aw * open * 0.7, ay - 2], [ax + aw * 0.98 + aw * open * 0.7, ay + ah + 2], [ax + aw * 0.5 + aw * open, ay + ah - 4]], rgb([32, 22, 18]))
  ctx.fillStyle = rgb([60, 50, 40])
  ctx.fillRect(ax + aw * 0.44, ay + ah * 0.48, 5, 18)

  // a low line of burning oil, dying
  const lx0 = W * 0.08
  const lx1 = W * 0.7
  const ly = H * 0.86
  glow(ctx, (lx0 + lx1) / 2, ly, W * 0.7, [210, 120, 55], 0.3 * fire * flick)
  glow(ctx, (lx0 + lx1) / 2, ly, W * 0.25, [230, 150, 70], 0.18 * fire * flick)
  for (let i = 0; i < 46; i++) {
    const u = i / 45
    const x = lerp(lx0, lx1, u) + Math.sin(u * 30) * 8
    const y = ly + Math.sin(u * 9) * 10
    const local = fire * (0.5 + 0.5 * Math.sin(u * 17 + 2)) * (u > 0.85 ? 1 - smooth(1, 3, t) : 1)
    const h = H * 0.065 * local * (1 + 0.12 * Math.sin(t * 9 + i))
    if (h < 1) continue
    const g = ctx.createLinearGradient(0, y - h, 0, y)
    g.addColorStop(0, 'rgba(255,200,120,0)')
    g.addColorStop(0.5, `rgba(240,150,70,${0.55 * local})`)
    g.addColorStop(1, `rgba(90,110,200,${0.35 * local})`)
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.moveTo(x - h * 0.3, y)
    ctx.quadraticCurveTo(x - h * 0.25, y - h * 0.5, x + Math.sin(t * 6 + i) * 3, y - h)
    ctx.quadraticCurveTo(x + h * 0.25, y - h * 0.5, x + h * 0.3, y)
    ctx.fill()
  }
  // thin smoke, drawn by the draught
  ctx.filter = 'blur(10px)'
  for (let k = 0; k < 9; k++) {
    const u = k / 8
    const x = lerp(lx0, lx1, u)
    ctx.strokeStyle = `rgba(150,145,140,${0.08 * fire})`
    ctx.lineWidth = 16
    ctx.beginPath()
    ctx.moveTo(x, ly - 10)
    for (let s = 1; s <= 8; s++) ctx.lineTo(x + s * 14 * gust + Math.sin(t * 1.4 + k + s) * 12, ly - 10 - s * H * 0.05)
    ctx.stroke()
  }
  ctx.filter = 'none'
  ctx.restore()

  vignette(ctx, W, H, 0.65)
  grain(ctx, W, H, 0.09, Math.floor(t * 24))
  const black = Math.max(smooth(7.75, 8.0, t), 1 - smooth(0, 0.5, t))
  if (black > 0) {
    ctx.fillStyle = `rgba(0,0,0,${black})`
    ctx.fillRect(0, 0, W, H)
  }
}

// ── Illustration 1: the bedroom from the doorway ─────────────────────────
function paper(ctx, W, H, base) {
  ctx.fillStyle = rgb(base)
  ctx.fillRect(0, 0, W, H)
  const r = rngOf(12)
  ctx.save()
  ctx.filter = 'blur(60px)'
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = `rgba(${r() > 0.5 ? '255,245,225' : '0,0,0'},${0.03 + r() * 0.04})`
    ctx.beginPath()
    ctx.ellipse(r() * W, r() * H, 100 + r() * 400, 80 + r() * 300, r() * 3, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}
function paperFinish(ctx, W, H) {
  ctx.save()
  ctx.globalCompositeOperation = 'multiply'
  ctx.globalAlpha = 0.22
  ctx.fillStyle = ctx.createPattern(noise(), 'repeat')
  ctx.fillRect(0, 0, W, H)
  ctx.globalCompositeOperation = 'overlay'
  ctx.globalAlpha = 0.12
  ctx.fillRect(0, 0, W, H)
  ctx.restore()
}
/** Gouache feel: thousands of faint short strokes over the whole picture. */
function brushwork(ctx, W, H, seed, n = 6000) {
  const r = rngOf(seed)
  ctx.save()
  ctx.lineCap = 'round'
  for (let i = 0; i < n; i++) {
    const x = r() * W
    const y = r() * H
    const a = r() * Math.PI
    const len = 10 + r() * 40
    ctx.strokeStyle = r() > 0.5 ? 'rgba(255,240,220,0.012)' : 'rgba(0,0,0,0.05)'
    ctx.lineWidth = 2 + r() * 7
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len)
    ctx.stroke()
  }
  ctx.restore()
}
function wash(ctx, pts, color, alpha, r, layers = 3) {
  for (let k = 0; k < layers; k++) {
    const jit = pts.map(([x, y]) => [x + (r() - 0.5) * 6, y + (r() - 0.5) * 6])
    poly(ctx, jit, rgb(color, alpha / layers + 0.12))
  }
}

function bedroom(ctx, W, H) {
  const r = rngOf(2026)
  const INK = 'rgba(8,7,8,0.92)'
  paper(ctx, W, H, [32, 27, 25])
  const lampX = W * 0.17
  const lampY = H * 0.5
  // room in perspective: back wall, floor, side walls
  const bw = [[W * 0.3, H * 0.2], [W * 0.78, H * 0.2], [W * 0.78, H * 0.66], [W * 0.3, H * 0.66]]
  wash(ctx, [[0, 0], [W * 0.3, H * 0.2], [W * 0.3, H * 0.66], [0, H * 1.02]], [52, 42, 36], 0.9, r)
  wash(ctx, bw, [40, 34, 31], 0.9, r)
  wash(ctx, [[W * 0.78, H * 0.2], [W, 0], [W, H], [W * 0.78, H * 0.66]], [22, 19, 19], 0.9, r)
  wash(ctx, [[W * 0.3, H * 0.66], [W * 0.78, H * 0.66], [W * 1.05, H], [-W * 0.05, H]], [30, 24, 21], 0.9, r)
  wash(ctx, [[0, 0], [W, 0], [W * 0.78, H * 0.2], [W * 0.3, H * 0.2]], [14, 12, 12], 0.9, r)
  // floorboards
  for (let k = 0; k <= 14; k++) {
    const u = k / 14
    inkLine(ctx, [[lerp(W * 0.3, W * 0.78, u), H * 0.66], [lerp(-W * 0.08, W * 1.08, u), H]], 1.6, 'rgba(8,7,8,0.5)', r)
  }
  // damp marks on the boards, leading to the bed
  for (let k = 0; k < 9; k++) {
    const u = k / 8
    ctx.fillStyle = 'rgba(4,3,4,0.55)'
    ctx.beginPath()
    ctx.ellipse(lerp(W * 0.36, W * 0.47, u) + (r() - 0.5) * 30, lerp(H * 0.98, H * 0.8, u), 40 - u * 14, 13 - u * 4, 0.2, 0, Math.PI * 2)
    ctx.fill()
  }
  // the bed against the far wall; the shape under the quilt is too long
  const hb = [[W * 0.45, H * 0.36], [W * 0.5, H * 0.31], [W * 0.6, H * 0.31], [W * 0.65, H * 0.36], [W * 0.65, H * 0.58], [W * 0.45, H * 0.58]]
  wash(ctx, hb, [22, 16, 14], 0.95, r)
  inkLine(ctx, [...hb, hb[0]], 3, INK, r)
  for (const x of [W * 0.445, W * 0.655]) {
    wash(ctx, [[x - 8, H * 0.3], [x + 8, H * 0.3], [x + 8, H * 0.58], [x - 8, H * 0.58]], [16, 12, 11], 1, r)
    inkLine(ctx, [[x, H * 0.29], [x, H * 0.58]], 2.4, INK, r)
  }
  // pillow and nightcap; the face is lost in the shadow under the cap
  wash(ctx, [[W * 0.475, H * 0.5], [W * 0.625, H * 0.5], [W * 0.635, H * 0.545], [W * 0.465, H * 0.545]], [120, 112, 100], 0.85, r)
  inkLine(ctx, [[W * 0.475, H * 0.5], [W * 0.625, H * 0.5], [W * 0.635, H * 0.545], [W * 0.465, H * 0.545], [W * 0.475, H * 0.5]], 2.2, INK, r)
  ctx.fillStyle = rgb([150, 142, 128], 0.95)
  ctx.beginPath()
  ctx.moveTo(W * 0.515, H * 0.515)
  ctx.bezierCurveTo(W * 0.515, H * 0.47, W * 0.545, H * 0.455, W * 0.565, H * 0.462)
  ctx.bezierCurveTo(W * 0.59, H * 0.47, W * 0.595, H * 0.5, W * 0.59, H * 0.52)
  ctx.closePath()
  ctx.fill()
  inkLine(ctx, [[W * 0.515, H * 0.515], [W * 0.522, H * 0.475], [W * 0.55, H * 0.458], [W * 0.578, H * 0.465], [W * 0.592, H * 0.52]], 2.2, INK, r)
  for (let k = 0; k < 9; k++) {
    // frill along the brim
    ctx.fillStyle = rgb([165, 156, 140], 0.9)
    ctx.beginPath()
    ctx.arc(W * (0.514 + k * 0.0098), H * 0.52, W * 0.0055, 0, Math.PI)
    ctx.fill()
  }
  const face = ctx.createLinearGradient(0, H * 0.52, 0, H * 0.55)
  face.addColorStop(0, 'rgba(10,8,8,0.95)')
  face.addColorStop(1, 'rgba(10,8,8,0.4)')
  ctx.fillStyle = face
  ctx.fillRect(W * 0.522, H * 0.523, W * 0.062, H * 0.022)
  // quilt: drawn up to the chin, running past the footboard
  const quilt = [[W * 0.46, H * 0.542], [W * 0.64, H * 0.542], [W * 0.72, H * 0.86], [W * 0.66, H * 0.93], [W * 0.38, H * 0.9]]
  wash(ctx, quilt, [52, 24, 28], 0.9, r)
  ctx.save()
  ctx.beginPath()
  quilt.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
  ctx.closePath()
  ctx.clip()
  for (let k = 1; k < 9; k++) {
    const u = k / 9
    inkLine(ctx, [[lerp(W * 0.46, W * 0.38, u), lerp(H * 0.5, H * 0.9, u)], [lerp(W * 0.64, W * 0.72, u), lerp(H * 0.5, H * 0.86, u)]], 1.4, 'rgba(10,6,7,0.45)', r)
  }
  for (let k = 1; k < 6; k++) {
    const u = k / 6
    inkLine(ctx, [[lerp(W * 0.46, W * 0.64, u), H * 0.5], [lerp(W * 0.38, W * 0.72, u), H * 0.9]], 1.4, 'rgba(10,6,7,0.45)', r)
  }
  ctx.restore()
  ctx.fillStyle = 'rgba(0,0,0,0.35)'
  ctx.beginPath()
  ctx.moveTo(W * 0.5, H * 0.52)
  ctx.bezierCurveTo(W * 0.56, H * 0.62, W * 0.54, H * 0.76, W * 0.6, H * 0.92)
  ctx.lineTo(W * 0.66, H * 0.92)
  ctx.bezierCurveTo(W * 0.62, H * 0.74, W * 0.62, H * 0.6, W * 0.6, H * 0.52)
  ctx.fill()
  inkLine(ctx, [...quilt, quilt[0]], 3.2, INK, r)
  // footboard, with the shape pressing past it under the cloth
  const fb = [[W * 0.4, H * 0.76], [W * 0.68, H * 0.76], [W * 0.69, H * 0.86], [W * 0.39, H * 0.86]]
  wash(ctx, fb, [20, 15, 13], 1, r)
  inkLine(ctx, [...fb, fb[0]], 3.5, INK, r)
  ctx.fillStyle = rgb([46, 20, 24], 0.97)
  ctx.beginPath()
  ctx.moveTo(W * 0.55, H * 0.76)
  ctx.bezierCurveTo(W * 0.58, H * 0.74, W * 0.66, H * 0.8, W * 0.64, H * 0.9)
  ctx.bezierCurveTo(W * 0.62, H * 0.95, W * 0.56, H * 0.93, W * 0.54, H * 0.88)
  ctx.closePath()
  ctx.fill()
  inkLine(ctx, [[W * 0.55, H * 0.76], [W * 0.62, H * 0.78], [W * 0.645, H * 0.88], [W * 0.6, H * 0.93], [W * 0.54, H * 0.88]], 2.6, INK, r)
  // bedposts, with fresh scratches on the near one
  for (const x of [W * 0.395, W * 0.68]) {
    wash(ctx, [[x - 9, H * 0.66], [x + 9, H * 0.66], [x + 10, H * 0.9], [x - 10, H * 0.9]], [16, 12, 11], 1, r)
    inkLine(ctx, [[x, H * 0.64], [x, H * 0.9]], 2, INK, r)
  }
  ctx.strokeStyle = 'rgba(200,188,168,0.55)'
  ctx.lineWidth = 1.6
  for (let k = 0; k < 4; k++) {
    ctx.beginPath()
    ctx.moveTo(W * 0.672, H * (0.71 + k * 0.012))
    ctx.lineTo(W * 0.688, H * (0.735 + k * 0.012))
    ctx.stroke()
  }
  // nightstand with folded spectacles
  wash(ctx, [[W * 0.67, H * 0.56], [W * 0.74, H * 0.56], [W * 0.74, H * 0.7], [W * 0.67, H * 0.7]], [24, 19, 17], 1, r)
  inkLine(ctx, [[W * 0.67, H * 0.56], [W * 0.74, H * 0.56], [W * 0.74, H * 0.7], [W * 0.67, H * 0.7], [W * 0.67, H * 0.56]], 2.4, INK, r)
  ctx.strokeStyle = 'rgba(190,180,160,0.6)'
  ctx.lineWidth = 2
  for (const x of [W * 0.695, W * 0.712]) {
    ctx.beginPath()
    ctx.ellipse(x, H * 0.553, 9, 5, 0, 0, Math.PI * 2)
    ctx.stroke()
  }
  // the wardrobe in the right corner, open a hand's width onto darkness
  const wd = [[W * 0.8, H * 0.12], [W * 0.97, H * 0.04], [W * 0.97, H * 0.95], [W * 0.8, H * 0.78]]
  wash(ctx, wd, [21, 16, 14], 1, r)
  poly(ctx, [[W * 0.86, H * 0.1], [W * 0.885, H * 0.09], [W * 0.885, H * 0.83], [W * 0.86, H * 0.8]], rgb([2, 2, 2]))
  inkLine(ctx, [...wd, wd[0]], 3.5, INK, r)
  inkLine(ctx, [[W * 0.86, H * 0.1], [W * 0.86, H * 0.8]], 2.4, INK, r)
  inkLine(ctx, [[W * 0.802, H * 0.13], [W * 0.802, H * 0.77]], 2, 'rgba(150,110,70,0.35)', r)
  // left wall: the low casement window at hip height, just beyond the dresser
  const win = [[W * 0.24, H * 0.42], [W * 0.29, H * 0.44], [W * 0.29, H * 0.58], [W * 0.24, H * 0.6]]
  wash(ctx, win, [20, 28, 44], 1, r)
  inkLine(ctx, [...win, win[0]], 3, INK, r)
  inkLine(ctx, [[W * 0.265, H * 0.43], [W * 0.265, H * 0.59]], 2, INK, r)
  // the dresser near the viewer, with the basket and the lamp
  const dr = [[-W * 0.02, H * 0.6], [W * 0.235, H * 0.56], [W * 0.235, H * 0.82], [-W * 0.02, H * 0.98]]
  wash(ctx, dr, [30, 22, 18], 1, r)
  inkLine(ctx, [...dr, dr[0]], 3.5, INK, r)
  inkLine(ctx, [[0, H * 0.74], [W * 0.235, H * 0.68]], 2, INK, r)
  wash(ctx, [[W * 0.03, H * 0.555], [W * 0.13, H * 0.545], [W * 0.12, H * 0.6], [W * 0.045, H * 0.61]], [62, 46, 32], 1, r)
  inkLine(ctx, [[W * 0.03, H * 0.555], [W * 0.13, H * 0.545], [W * 0.12, H * 0.6], [W * 0.045, H * 0.61], [W * 0.03, H * 0.555]], 2.4, INK, r)
  for (let k = 1; k < 7; k++) inkLine(ctx, [[W * (0.03 + k * 0.014), H * 0.552], [W * (0.042 + k * 0.012), H * 0.606]], 1.2, 'rgba(10,8,8,0.6)', r)
  ctx.strokeStyle = 'rgba(30,22,16,1)'
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.moveTo(W * 0.035, H * 0.553)
  ctx.bezierCurveTo(W * 0.04, H * 0.47, W * 0.12, H * 0.465, W * 0.125, H * 0.547)
  ctx.stroke()
  // lamp: brass base, glass chimney, flame turned down to a bead
  ctx.fillStyle = rgb([70, 56, 36])
  ctx.beginPath()
  ctx.ellipse(lampX, H * 0.555, W * 0.022, H * 0.012, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillRect(lampX - W * 0.015, H * 0.515, W * 0.03, H * 0.04)
  ctx.strokeStyle = 'rgba(200,190,170,0.35)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(lampX - W * 0.009, H * 0.515)
  ctx.bezierCurveTo(lampX - W * 0.016, H * 0.49, lampX - W * 0.006, H * 0.47, lampX - W * 0.006, H * 0.445)
  ctx.moveTo(lampX + W * 0.009, H * 0.515)
  ctx.bezierCurveTo(lampX + W * 0.016, H * 0.49, lampX + W * 0.006, H * 0.47, lampX + W * 0.006, H * 0.445)
  ctx.stroke()
  // single warm light source, most of the frame left in shadow
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  glow(ctx, lampX, lampY, W * 0.42, [150, 96, 50], 0.22)
  glow(ctx, lampX, lampY, W * 0.12, [230, 170, 100], 0.2)
  glow(ctx, lampX, H * 0.5, W * 0.012, [255, 225, 160], 0.95)
  ctx.restore()
  const shade = ctx.createRadialGradient(lampX, lampY, W * 0.05, lampX, lampY, W * 1.0)
  shade.addColorStop(0, 'rgba(0,0,0,0)')
  shade.addColorStop(0.5, 'rgba(0,0,0,0.25)')
  shade.addColorStop(1, 'rgba(0,0,0,0.62)')
  ctx.fillStyle = shade
  ctx.fillRect(0, 0, W, H)
  // the doorway we stand in
  wash(ctx, [[0, 0], [W * 0.03, 0], [W * 0.03, H], [0, H]], [6, 5, 5], 1, r)
  wash(ctx, [[W * 0.985, 0], [W, 0], [W, H], [W * 0.985, H]], [6, 5, 5], 1, r)
  brushwork(ctx, W, H, 5)
  paperFinish(ctx, W, H)
  vignette(ctx, W, H, 0.55, 0.3)
}

// ── Illustration 2: the hood on the thorns ──────────────────────────────
function thorns(ctx, W, H) {
  const r = rngOf(1697)
  paper(ctx, W, H, [16, 19, 26])
  const sky = ctx.createLinearGradient(0, 0, 0, H * 0.6)
  sky.addColorStop(0, rgb([10, 13, 20], 0.9))
  sky.addColorStop(1, rgb([44, 52, 66], 0.85))
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, W, H * 0.6)
  // the moon, cold
  glow(ctx, W * 0.7, H * 0.16, W * 0.5, [170, 185, 205], 0.18)
  ctx.fillStyle = rgb([214, 214, 206], 0.92)
  ctx.beginPath()
  ctx.arc(W * 0.7, H * 0.16, W * 0.045, 0, Math.PI * 2)
  ctx.fill()
  // far field and the cottage beneath three oaks, one window faintly lit
  ctx.fillStyle = rgb([22, 26, 33])
  ctx.fillRect(0, H * 0.5, W, H * 0.5)
  const cy = H * 0.5
  ctx.fillStyle = rgb([18, 21, 27])
  for (const [x, rad] of [[W * 0.42, W * 0.09], [W * 0.53, W * 0.11], [W * 0.65, W * 0.085]]) {
    ctx.fillRect(x - 5, cy - rad * 1.4, 10, rad * 1.4)
    for (let k = 0; k < 12; k++) {
      ctx.beginPath()
      ctx.ellipse(x + (r() - 0.5) * rad * 1.6, cy - rad * 1.5 + (r() - 0.5) * rad * 0.8, rad * (0.3 + r() * 0.3), rad * (0.22 + r() * 0.2), 0, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.fillStyle = rgb([14, 16, 20])
  ctx.fillRect(W * 0.47, cy - H * 0.035, W * 0.12, H * 0.035)
  poly(ctx, [[W * 0.46, cy - H * 0.034], [W * 0.6, cy - H * 0.034], [W * 0.53, cy - H * 0.07]], rgb([12, 14, 18]))
  ctx.fillRect(W * 0.565, cy - H * 0.075, W * 0.012, H * 0.03)
  glow(ctx, W * 0.505, cy - H * 0.018, W * 0.03, [220, 160, 90], 0.45)
  ctx.fillStyle = rgb([200, 150, 90], 0.75)
  ctx.fillRect(W * 0.5, cy - H * 0.024, W * 0.012, H * 0.012)
  // low mist
  ctx.save()
  ctx.filter = 'blur(40px)'
  for (let k = 0; k < 16; k++) {
    ctx.fillStyle = `rgba(170,180,195,${0.05 + r() * 0.05})`
    ctx.beginPath()
    ctx.ellipse(r() * W, cy + (r() - 0.3) * H * 0.06, W * (0.2 + r() * 0.3), H * 0.025, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
  // forest edge framing both sides
  for (const side of [0, 1]) {
    for (let k = 0; k < 5; k++) {
      const x = side ? W * (0.84 + k * 0.05 + r() * 0.03) : W * (0.02 + k * 0.045 + r() * 0.03)
      const w = W * (0.02 + r() * 0.03)
      poly(ctx, [[x - w / 2, H], [x + w / 2, H], [x + w * 0.2, -10], [x - w * 0.2, -10]], rgb([7, 8, 10]))
      for (let b = 0; b < 6; b++) {
        const y = H * (0.08 + r() * 0.5)
        const dir = side ? -1 : 1
        inkLine(ctx, [[x, y], [x + dir * W * (0.06 + r() * 0.12), y - H * (0.03 + r() * 0.06)]], 2 + r() * 4, 'rgba(7,8,10,1)', r, 2)
      }
    }
  }
  // brambles: arching black stems with thorns
  const stem = (pts, width) => {
    ctx.strokeStyle = rgb([6, 6, 8])
    ctx.lineWidth = width
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(pts[0][0], pts[0][1])
    ctx.bezierCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1], pts[3][0], pts[3][1])
    ctx.stroke()
    ctx.fillStyle = rgb([6, 6, 8])
    for (let k = 1; k < 14; k++) {
      const u = k / 14
      const p = bez(pts, u)
      const q = bez(pts, u + 0.01)
      const a = Math.atan2(q[1] - p[1], q[0] - p[0]) + (k % 2 ? 1 : -1) * 1.2
      ctx.beginPath()
      ctx.moveTo(p[0] - Math.cos(a + 1.57) * width * 0.4, p[1] - Math.sin(a + 1.57) * width * 0.4)
      ctx.lineTo(p[0] + Math.cos(a) * width * 2.2, p[1] + Math.sin(a) * width * 2.2)
      ctx.lineTo(p[0] + Math.cos(a + 1.57) * width * 0.4, p[1] + Math.sin(a + 1.57) * width * 0.4)
      ctx.fill()
    }
  }
  const bez = (p, u) => {
    const v = 1 - u
    return [0, 1].map((i) => v * v * v * p[0][i] + 3 * v * v * u * p[1][i] + 3 * v * u * u * p[2][i] + u * u * u * p[3][i])
  }
  const stems = []
  for (let k = 0; k < 16; k++) {
    const x0 = r() * W
    const x1 = x0 + (r() - 0.5) * W * 0.9
    const peak = H * (0.64 + r() * 0.16)
    stems.push([[[x0, H + 20], [x0 + (x1 - x0) * 0.2, peak - H * 0.08], [x1 - (x1 - x0) * 0.2, peak], [x1, H * (0.78 + r() * 0.22)]], 5 + r() * 9])
  }
  stems.slice(0, 9).forEach(([p, w]) => stem(p, w))

  // the empty red hood, snagged on a bramble and hanging crumpled; the clasp torn
  const hx = W * 0.4
  const hy = H * 0.73
  const red = [112, 22, 31]
  const deep = mix(red, [18, 5, 9], 0.45)
  glow(ctx, hx, hy, W * 0.3, [110, 28, 38], 0.1)
  ctx.save()
  ctx.translate(hx, hy)
  ctx.rotate(-0.18)
  // cloak: draped over the stem, sagging, hem torn and uneven
  ctx.fillStyle = rgb(deep)
  ctx.beginPath()
  ctx.moveTo(-W * 0.2, -H * 0.005)
  ctx.bezierCurveTo(-W * 0.12, -H * 0.035, W * 0.02, -H * 0.04, W * 0.13, -H * 0.012)
  ctx.bezierCurveTo(W * 0.17, H * 0.05, W * 0.15, H * 0.12, W * 0.12, H * 0.17)
  ctx.lineTo(W * 0.08, H * 0.14)
  ctx.lineTo(W * 0.05, H * 0.19)
  ctx.lineTo(W * 0.0, H * 0.15)
  ctx.lineTo(-W * 0.05, H * 0.2)
  ctx.lineTo(-W * 0.09, H * 0.13)
  ctx.lineTo(-W * 0.14, H * 0.16)
  ctx.bezierCurveTo(-W * 0.19, H * 0.1, -W * 0.22, H * 0.04, -W * 0.2, -H * 0.005)
  ctx.closePath()
  ctx.fill()
  // front panel where the moon catches it
  ctx.fillStyle = rgb(red)
  ctx.beginPath()
  ctx.moveTo(-W * 0.15, -H * 0.02)
  ctx.bezierCurveTo(-W * 0.06, -H * 0.04, W * 0.04, -H * 0.035, W * 0.11, -H * 0.012)
  ctx.bezierCurveTo(W * 0.12, H * 0.05, W * 0.08, H * 0.1, W * 0.05, H * 0.15)
  ctx.lineTo(W * 0.0, H * 0.12)
  ctx.lineTo(-W * 0.05, H * 0.16)
  ctx.bezierCurveTo(-W * 0.1, H * 0.08, -W * 0.16, H * 0.03, -W * 0.15, -H * 0.02)
  ctx.closePath()
  ctx.fill()
  // folds
  ctx.strokeStyle = rgb(mix(red, [0, 0, 0], 0.55), 0.8)
  ctx.lineWidth = 5
  for (const [x0, x1, y1] of [[-0.1, -0.08, 0.13], [-0.04, -0.02, 0.14], [0.02, 0.03, 0.13], [0.07, 0.06, 0.12]]) {
    ctx.beginPath()
    ctx.moveTo(W * x0, -H * 0.02)
    ctx.bezierCurveTo(W * (x0 - 0.01), H * 0.04, W * (x1 + 0.01), H * 0.08, W * x1, H * y1)
    ctx.stroke()
  }
  // the hood, collapsed flat and hanging off one side: only a thin dark fold where a face would be
  ctx.fillStyle = rgb(red)
  ctx.beginPath()
  ctx.moveTo(W * 0.1, -H * 0.02)
  ctx.bezierCurveTo(W * 0.15, -H * 0.05, W * 0.2, -H * 0.075, W * 0.25, -H * 0.085)
  ctx.bezierCurveTo(W * 0.24, -H * 0.04, W * 0.235, -H * 0.01, W * 0.22, H * 0.03)
  ctx.bezierCurveTo(W * 0.21, H * 0.07, W * 0.16, H * 0.08, W * 0.13, H * 0.05)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = rgb([14, 4, 7])
  ctx.lineWidth = 7
  ctx.beginPath()
  ctx.moveTo(W * 0.125, -H * 0.012)
  ctx.bezierCurveTo(W * 0.16, -H * 0.03, W * 0.2, -H * 0.01, W * 0.195, H * 0.035)
  ctx.stroke()
  // moonlight along the top edge
  ctx.strokeStyle = 'rgba(205,195,205,0.3)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(-W * 0.18, -H * 0.012)
  ctx.bezierCurveTo(-W * 0.1, -H * 0.04, W * 0.05, -H * 0.042, W * 0.17, -H * 0.045)
  ctx.stroke()
  // the torn clasp ribbon
  ctx.strokeStyle = rgb([90, 16, 24])
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.moveTo(-W * 0.17, H * 0.0)
  ctx.bezierCurveTo(-W * 0.19, H * 0.05, -W * 0.17, H * 0.08, -W * 0.185, H * 0.11)
  ctx.stroke()
  ctx.fillStyle = rgb([150, 140, 120], 0.75)
  ctx.beginPath()
  ctx.arc(-W * 0.185, H * 0.113, 5, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
  // thorns in front of the cloth hold it fast
  stems.slice(9).forEach(([p, w]) => stem(p, w))
  // the stem the cloth hangs from
  stem([[hx - W * 0.42, H * 0.8], [hx - W * 0.15, hy - H * 0.07], [hx + W * 0.12, hy - H * 0.08], [hx + W * 0.5, H * 0.74]], 8)
  brushwork(ctx, W, H, 9, 4000)
  paperFinish(ctx, W, H)
  vignette(ctx, W, H, 0.6, 0.32)
}

window.scenes = { intro, room, bedroom, thorns }
