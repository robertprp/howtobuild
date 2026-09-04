import { createRouterClient } from '@orpc/server'
import { describe, expect, it } from 'vitest'

import { appRouter } from '../src/orpc/router'

describe('application procedures', () => {
  const client = createRouterClient(appRouter, {
    context: { request: new Request('http://localhost/api/rpc') },
  })

  it('returns server health', async () => {
    await expect(client.system.health()).resolves.toMatchObject({
      ok: true,
      runtime: 'server',
    })
  })

  it('validates and normalizes mutation input', async () => {
    await expect(
      client.system.echo({ message: 'Hello, Phase 0!' }),
    ).resolves.toEqual({
      accepted: true,
      normalized: 'hello-phase-0-',
    })
  })
})
