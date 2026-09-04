import { readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { processAsset } from '../src/features/assets/pipeline.server'

describe('asset derivative pipeline', () => {
  it('generates deterministic WebP derivative metadata', async () => {
    const fixture = join(
      process.cwd(),
      'tests',
      'fixtures',
      'phase-zero-logo.svg',
    )
    const output = join(tmpdir(), `howtobuild-assets-${process.pid}`)
    const manifest = await processAsset(fixture, output, 'logo')

    expect(manifest.kind).toBe('logo')
    expect(manifest.checksum).toMatch(/^[a-f0-9]{64}$/)
    expect(manifest.derivatives.map(({ width }) => width)).toEqual([
      64, 128, 256,
    ])
    await expect(
      readFile(join(output, manifest.derivatives[0].filename)),
    ).resolves.toBeTruthy()
  })

})
