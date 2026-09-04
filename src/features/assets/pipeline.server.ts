import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, join } from 'node:path'

import sharp from 'sharp'

type AssetKind = 'logo' | 'photo'

const widths: Record<AssetKind, number[]> = {
  logo: [64, 128, 256],
  photo: [640, 1280, 1920],
}

export async function processAsset(
  inputPath: string,
  outputDirectory: string,
  kind: AssetKind,
) {
  const source = await readFile(inputPath)
  const checksum = createHash('sha256').update(source).digest('hex')
  const stem = basename(inputPath).replace(/\.[^.]+$/, '')
  await mkdir(outputDirectory, { recursive: true })

  const derivatives = await Promise.all(
    widths[kind].map(async (width) => {
      const filename = `${stem}-${width}.webp`
      const path = join(outputDirectory, filename)
      await sharp(source)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: kind === 'logo' ? 90 : 82 })
        .toFile(path)
      return { filename, width, contentType: 'image/webp' }
    }),
  )

  const manifest = {
    source: inputPath,
    kind,
    checksum,
    generatedAt: new Date().toISOString(),
    derivatives,
  }
  await writeFile(
    join(outputDirectory, `${stem}.manifest.json`),
    JSON.stringify(manifest, null, 2),
  )
  return manifest
}

export async function uploadToSupabaseStorage(
  filePath: string,
  objectPath: string,
) {
  const baseUrl = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const bucket = process.env.SUPABASE_ASSET_BUCKET ?? 'assets'
  if (!baseUrl || !serviceKey)
    throw new Error('Supabase Storage is not configured')

  const body = await readFile(filePath)
  const response = await fetch(
    `${baseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${objectPath.split('/').map(encodeURIComponent).join('/')}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
        'Content-Type': 'image/webp',
        'x-upsert': 'true',
      },
      body,
    },
  )

  if (!response.ok)
    throw new Error(`Supabase Storage upload failed (${response.status})`)
  return `${baseUrl}/storage/v1/object/public/${bucket}/${objectPath}`
}
