import { os } from '@orpc/server'
import { z } from 'zod'

export const appRouter = {
  system: {
    health: os.handler(() => ({
      ok: true as const,
      runtime: 'server',
      checkedAt: new Date().toISOString(),
    })),
    echo: os
      .input(z.object({ message: z.string().trim().min(1).max(120) }))
      .handler(({ input }) => ({
        accepted: true as const,
        normalized: input.message.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-'),
      })),
  },
}

export type AppRouter = typeof appRouter
