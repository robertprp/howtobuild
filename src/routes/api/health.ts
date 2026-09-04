import { createFileRoute } from '@tanstack/react-router'

import { checkDatabase } from '../../db/client.server'

export const Route = createFileRoute('/api/health')({
  server: {
    handlers: {
      GET: async () => {
        try {
          const database = await checkDatabase()
          return Response.json({ ok: true, database })
        } catch (error) {
          return Response.json(
            {
              ok: false,
              database: null,
              error:
                error instanceof Error
                  ? error.message
                  : 'Database check failed',
            },
            { status: 503 },
          )
        }
      },
    },
  },
})
