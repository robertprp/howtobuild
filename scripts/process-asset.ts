import { join } from 'node:path'

import {
  processAsset,
  uploadToSupabaseStorage,
} from '../src/features/assets/pipeline.server'

const [inputPath, kind = 'photo', outputDirectory = '.generated-assets'] =
  process.argv.slice(2)
if (!inputPath || !['logo', 'photo'].includes(kind)) {
  throw new Error(
    'Usage: pnpm asset:process <input> <logo|photo> [output-directory]',
  )
}

const manifest = await processAsset(
  inputPath,
  outputDirectory,
  kind as 'logo' | 'photo',
)
const uploaded = process.env.SUPABASE_URL
  ? await Promise.all(
      manifest.derivatives.map((derivative) =>
        uploadToSupabaseStorage(
          join(outputDirectory, derivative.filename),
          `phase-zero/${derivative.filename}`,
        ),
      ),
    )
  : []

console.log(JSON.stringify({ manifest, uploaded }, null, 2))
