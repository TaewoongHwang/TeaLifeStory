// Resize and encode image_gen artwork for the app. Original images stay untouched.
import { chromium } from '@playwright/test'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const root = new URL('../', import.meta.url)
const browser = await chromium.launch()
try {
  const page = await browser.newPage()
  const hero = (await readFile(new URL('assets/generated/chagok-tea-hero-source.png', root))).toString('base64')
  const mark = (await readFile(new URL('assets/generated/chagok-mark-source.png', root))).toString('base64')
  const variants = [
    { name: 'images/chagok-tea-hero.webp', source: hero, width: 960, height: 640, type: 'image/webp' },
    { name: 'images/chagok-tea-hero-small.webp', source: hero, width: 600, height: 400, type: 'image/webp' },
    { name: 'icons/chagok-icon-192.png', source: mark, width: 192, height: 192, type: 'image/png' },
    { name: 'icons/chagok-icon-512.png', source: mark, width: 512, height: 512, type: 'image/png' },
    { name: 'icons/chagok-icon-maskable-512.png', source: mark, width: 512, height: 512, type: 'image/png', padding: .1 },
    { name: 'icons/chagok-apple-touch-icon.png', source: mark, width: 180, height: 180, type: 'image/png' },
  ]
  await mkdir(new URL('public/images/', root), { recursive: true })
  await mkdir(new URL('public/icons/', root), { recursive: true })
  for (const variant of variants) {
    const data = await page.evaluate(async ({ source, width, height, type, padding = 0 }) => {
      const image = new Image()
      image.src = `data:image/png;base64,${source}`
      await image.decode()
      const canvas = document.createElement('canvas')
      canvas.width = width; canvas.height = height
      const ctx = canvas.getContext('2d', { alpha: false })
      ctx.fillStyle = '#f8f2e8'
      ctx.fillRect(0, 0, width, height)
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(image, width * padding, height * padding, width * (1 - 2 * padding), height * (1 - 2 * padding))
      return canvas.toDataURL(type, .86).split(',')[1]
    }, variant)
    const target = new URL(`public/${variant.name}`, root)
    const bytes = Buffer.from(data, 'base64')
    await writeFile(target, bytes)
    console.log(`${fileURLToPath(target)} (${bytes.length} bytes)`)
  }
} finally {
  await browser.close()
}
