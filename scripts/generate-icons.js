// Dependency-free PNG rasterizer for the project's vector-style app mark.
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
const bg = [48, 76, 63], paper = [245, 242, 233], sage = [181, 197, 160]
function segment(x, y, ax, ay, bx, by, radius) {
  const t = Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2)))
  return (x - ax - t * (bx - ax)) ** 2 + (y - ay - t * (by - ay)) ** 2 < radius ** 2
}
function pixel(x, y) {
  let color = bg
  if ((x >= 145 && x <= 344 && y >= 250 && y <= 312) || ((x - 244) ** 2 / 99 ** 2 + (y - 312) ** 2 / 76 ** 2 < 1 && y >= 312)) color = paper
  const handle = (x - 346) ** 2 / 59 ** 2 + (y - 298) ** 2 / 41 ** 2
  const inside = (x - 346) ** 2 / 39 ** 2 + (y - 298) ** 2 / 22 ** 2
  if (x >= 344 && handle < 1 && inside > 1) color = paper
  if (segment(x, y, 125, 413, 387, 413, 7)) color = paper
  const u = (x - 286) * .63 + (y - 143) * -.78
  const v = (x - 286) * .78 + (y - 143) * .63
  if (u ** 2 / 66 ** 2 + v ** 2 / 32 ** 2 < 1) color = sage
  if (segment(x, y, 235, 211, 315, 107, 4)) color = bg
  return color
}
function crc32(bytes) {
  let crc = 0xffffffff
  for (const byte of bytes) {
    crc ^= byte
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0)
  }
  return (crc ^ 0xffffffff) >>> 0
}
function chunk(type, bytes) {
  const name = Buffer.from(type)
  const length = Buffer.alloc(4); length.writeUInt32BE(bytes.length)
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([name, bytes])))
  return Buffer.concat([length, name, bytes, crc])
}
function png(size) {
  const bytes = Buffer.alloc(size * (size * 3 + 1))
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const color = [0, 0, 0]
      for (const dy of [.25, .75]) for (const dx of [.25, .75]) {
        const sample = pixel((x + dx) / size * 512, (y + dy) / size * 512)
        sample.forEach((value, index) => { color[index] += value / 4 })
      }
      color.forEach((value, index) => { bytes[y * (size * 3 + 1) + 1 + x * 3 + index] = Math.round(value) })
    }
  }
  const header = Buffer.alloc(13); header.writeUInt32BE(size, 0); header.writeUInt32BE(size, 4); header[8] = 8; header[9] = 2
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', header), chunk('IDAT', deflateSync(bytes)), chunk('IEND', Buffer.alloc(0))])
}
mkdirSync('public/icons', { recursive: true })
for (const [file, size] of [['icon-192.png',192], ['icon-512.png',512], ['icon-maskable-512.png',512], ['apple-touch-icon.png',180]]) writeFileSync(`public/icons/${file}`, png(size))
console.log('Generated 192px, 512px, maskable and Apple touch icons.')
