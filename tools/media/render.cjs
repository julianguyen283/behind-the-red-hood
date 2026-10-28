/*
  Renders the procedural scenes in headless Chromium and encodes them.
  Usage: node tools/media/render.cjs <out_dir> [still|intro|room|all]
  Needs Playwright (preinstalled in this environment) and ffmpeg.
*/
const { chromium } = require('playwright')
const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

const out = path.resolve(process.argv[2] || 'out')
const which = process.argv[3] || 'all'
fs.mkdirSync(out, { recursive: true })

async function page(browser, W, H) {
  const p = await browser.newPage({ viewport: { width: W, height: H } })
  await p.goto('file://' + path.join(__dirname, 'render.html'))
  await p.evaluate(([W, H]) => {
    const c = document.getElementById('c')
    c.width = W
    c.height = H
    window.ctx = c.getContext('2d')
  }, [W, H])
  return p
}

async function still(browser, scene, W, H, file) {
  const p = await page(browser, W, H)
  const data = await p.evaluate(([scene, W, H]) => {
    window.scenes[scene](window.ctx, W, H)
    return document.getElementById('c').toDataURL('image/png')
  }, [scene, W, H])
  fs.writeFileSync(file, Buffer.from(data.split(',')[1], 'base64'))
  await p.close()
  console.log('wrote', file)
}

async function film(browser, scene, W, H, seconds, fps, file, posterAt) {
  const p = await page(browser, W, H)
  const ff = spawn('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '24', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', file], { stdio: ['pipe', 'inherit', 'inherit'] })
  const frames = Math.round(seconds * fps)
  for (let i = 0; i < frames; i++) {
    const t = i / fps
    const data = await p.evaluate(([scene, W, H, t]) => {
      window.scenes[scene](window.ctx, W, H, t)
      return document.getElementById('c').toDataURL('image/jpeg', 0.93)
    }, [scene, W, H, t])
    const buf = Buffer.from(data.split(',')[1], 'base64')
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r))
    if (posterAt !== undefined && i === Math.round(posterAt * fps)) fs.writeFileSync(file.replace(/\.mp4$/, '-poster.png'), Buffer.from((await p.evaluate(() => document.getElementById('c').toDataURL('image/png'))).split(',')[1], 'base64'))
    if (i % 120 === 0) console.log(scene, `${i}/${frames}`)
  }
  ff.stdin.end()
  await new Promise((r) => ff.on('close', r))
  await p.close()
  console.log('wrote', file)
}

;(async () => {
  const browser = await chromium.launch()
  if (which === 'still' || which === 'all') {
    await still(browser, 'bedroom', 2400, 1600, path.join(out, 'illustration-1.png'))
    await still(browser, 'thorns', 1600, 2000, path.join(out, 'illustration-2.png'))
  }
  if (which === 'room' || which === 'all') await film(browser, 'room', 1280, 720, 10, 24, path.join(out, 'story-2-video.mp4'), 1.5)
  if (which === 'intro' || which === 'all') await film(browser, 'intro', 1280, 720, 44.5, 24, path.join(out, 'intro-video.mp4'), 2.5)
  await browser.close()
})()
