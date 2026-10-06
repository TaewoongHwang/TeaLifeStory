// Dependency-free PNG rasterizer for the project's vector-style app mark.
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
const bg = [116, 63, 50], paper = [250, 245, 237], clay = [183, 125, 98]
function segment(x, y, ax, ay, bx, by, radius) {
  const t = Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2)))
  return (x - ax - t * (bx - ax)) ** 2 + (y - ay - t * (by - ay)) ** 2 < radius ** 2
}
function ellipse(x, y, cx, cy, rx, ry) {
  return (x - cx) ** 2 / rx ** 2 + (y - cy) ** 2 / ry ** 2 < 1
}
function polygon(x, y, points) {
  let inside = false
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [ax, ay] = points[i], [bx, by] = points[j]
    if ((ay > y) !== (by > y) && x < (bx - ax) * (y - ay) / (by - ay) + ax) inside = !inside
  }
  return inside
}
function pixel(x, y) {
  let color = bg
  // The whole teapot stays within the central maskable-icon safe circle.
  if (ellipse(x, y, 151, 290, 47, 42) && !ellipse(x, y, 151, 290, 29, 24)) color = paper
  if (polygon(x, y, [[334, 281], [378, 255], [390, 226], [423, 225], [414, 250], [369, 315], [339, 327]])) color = paper
  if (ellipse(x, y, 256, 302, 102, 62) || (x >= 222 && x <= 290 && y >= 359 && y <= 375)) color = paper
  if (ellipse(x, y, 256, 234, 68, 21) || ellipse(x, y, 256, 211, 15, 12)) color = paper
  if (ellipse(x, y, 256, 245, 84, 17)) color = bg
  if (ellipse(x, y, 256, 245, 78, 11)) color = paper
  if (segment(x, y, 182, 295, 195, 320, 2.5) || segment(x, y, 195, 320, 230, 339, 2.5)) color = clay
  if (ellipse(x, y, 309, 244, 4, 4)) color = bg
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
