import { join } from 'node:path'

import {
  processAsset,
  uploadToSupabaseStorage,
} from '../src/features/assets/pipeline.server'

const [
  inputPath,
  kind = 'photo',
  outputDirectory = '.generated-assets',
  sourceUrl,
  license,
  creator,
  altText = '',
] = process.argv.slice(2)
if (!inputPath || !['logo', 'photo'].includes(kind) || !sourceUrl || !license) {
  throw new Error(
    'Usage: pnpm asset:process <input> <logo|photo> <output-directory> <source-url> <license> [creator] [alt-text]',
  )
}

const manifest = await processAsset(
  inputPath,
  outputDirectory,
  kind as 'logo' | 'photo',
  {
    sourceUrl,
    license,
    creator,
    altText,
    capturedAt: new Date().toISOString(),
  },
)
const uploaded = process.env.SUPABASE_URL
  ? await Promise.all(
      manifest.derivatives.map((derivative) =>
        uploadToSupabaseStorage(
          join(outputDirectory, derivative.filename),
          `editorial/${derivative.filename}`,
          derivative.contentType,
        ),
      ),
    )
  : []

console.log(JSON.stringify({ manifest, uploaded }, null, 2))
