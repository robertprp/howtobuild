import { readFile, writeFile } from 'node:fs/promises'
import sharp from 'sharp'

// Reproducible raster/ICO derivatives of our code-native SVG artwork.
const icon = await readFile(new URL('../public/favicon.svg', import.meta.url))
for (const [name, size] of [
  ['favicon-96.png', 96],
  ['apple-touch-icon.png', 180],
  ['icon-192.png', 192],
  ['icon-512.png', 512],
] as const) {
  await sharp(icon)
    .resize(size, size)
    .png()
    .toFile(new URL(`../public/${name}`, import.meta.url).pathname)
}
const png = await sharp(icon).resize(48, 48).png().toBuffer()
const header = Buffer.alloc(22)
header.writeUInt16LE(1, 2)
header.writeUInt16LE(1, 4)
header[6] = 48
header[7] = 48
header.writeUInt16LE(1, 10)
header.writeUInt16LE(32, 12)
header.writeUInt32LE(png.length, 14)
header.writeUInt32LE(22, 18)
await writeFile(
  new URL('../public/favicon.ico', import.meta.url),
  Buffer.concat([header, png]),
)
await sharp(
  await readFile(new URL('../public/assets/social-card.svg', import.meta.url)),
)
  .png()
  .toFile(new URL('../public/assets/social-card.png', import.meta.url).pathname)
