import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, join } from 'node:path'

import sharp from 'sharp'

type AssetKind = 'logo' | 'photo'

export type AssetMetadata = {
  sourceUrl: string
  creator?: string
  license: string
  capturedAt: string
  altText: string
  focalPoint?: { x: number; y: number }
}

const widths: Record<AssetKind, number[]> = {
  logo: [64, 128, 256],
  photo: [480, 768, 1200, 1600],
}

export async function processAsset(
  inputPath: string,
  outputDirectory: string,
  kind: AssetKind,
  metadata: AssetMetadata = {
    sourceUrl: 'local-fixture',
    license: 'unverified-test-fixture',
    capturedAt: new Date(0).toISOString(),
    altText: '',
  },
) {
  const source = await readFile(inputPath)
  const checksum = createHash('sha256').update(source).digest('hex')
  const stem = basename(inputPath).replace(/\.[^.]+$/, '')
  const dimensions = await sharp(source).metadata()
  await mkdir(outputDirectory, { recursive: true })

  const derivatives = await Promise.all(
    widths[kind].flatMap((width) =>
      (kind === 'photo'
        ? ([
            ['avif', 'image/avif'],
            ['webp', 'image/webp'],
            ['jpeg', 'image/jpeg'],
          ] as const)
        : ([['webp', 'image/webp']] as const)
      ).map(async ([format, contentType]) => {
        const filename = `${stem}-${width}.${format === 'jpeg' ? 'jpg' : format}`
        const path = join(outputDirectory, filename)
        const image = sharp(source).resize({ width, withoutEnlargement: true })
        if (format === 'avif') await image.avif({ quality: 68 }).toFile(path)
        else if (format === 'webp')
          await image.webp({ quality: kind === 'logo' ? 90 : 82 }).toFile(path)
        else await image.jpeg({ quality: 82, progressive: true }).toFile(path)
        return { filename, width, format, contentType }
      }),
    ),
  )

  const manifest = {
    source: inputPath,
    sourceUrl: metadata.sourceUrl,
    creator: metadata.creator ?? null,
    license: metadata.license,
    capturedAt: metadata.capturedAt,
    altText: metadata.altText,
    focalPoint: metadata.focalPoint ?? { x: 50, y: 50 },
    kind,
    checksum,
    sourceDimensions: {
      width: dimensions.width,
      height: dimensions.height,
    },
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
  contentType = filePath.endsWith('.avif')
    ? 'image/avif'
    : filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')
      ? 'image/jpeg'
      : 'image/webp',
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
        'Content-Type': contentType,
        'x-upsert': 'true',
      },
      body,
    },
  )

  if (!response.ok)
    throw new Error(`Supabase Storage upload failed (${response.status})`)
  return `${baseUrl}/storage/v1/object/public/${bucket}/${objectPath}`
}
