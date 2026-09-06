import { createFileRoute } from '@tanstack/react-router'

import { checkDatabase } from '../../db/client.server'

export const Route = createFileRoute('/api/health')({
  server: {
    handlers: {
      GET: async () => {
        try {
          await checkDatabase()
          return Response.json(
            { ok: true },
            { headers: { 'Cache-Control': 'no-store' } },
          )
        } catch {
          return Response.json(
            {
              ok: false,
              error: 'Service unavailable',
            },
            { status: 503, headers: { 'Cache-Control': 'no-store' } },
          )
        }
      },
    },
  },
})
