import { createFileRoute } from '@tanstack/react-router'

import { collectGitHubRepository } from '../../../features/github/collector'
import {
  postgresSnapshotStore,
  withCollectorLease,
} from '../../../features/github/store.server'

export const Route = createFileRoute('/api/jobs/github')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const cronSecret = process.env.CRON_SECRET
        if (
          !cronSecret ||
          request.headers.get('authorization') !== `Bearer ${cronSecret}`
        ) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = process.env.GITHUB_TOKEN
        if (!token)
          return Response.json(
            { error: 'GITHUB_TOKEN is not configured' },
            { status: 503 },
          )

        const coordinate = process.env.GITHUB_REPOSITORY ?? 'tanstack/router'
        try {
          const result = await withCollectorLease('github-collector', () =>
            collectGitHubRepository(coordinate, token, postgresSnapshotStore),
          )
          return Response.json({ ok: true, result })
        } catch (error) {
          console.error('GitHub collection failed', error)
          return Response.json(
            { error: 'GitHub collection failed' },
            { status: 500 },
          )
        }
      },
    },
  },
})
