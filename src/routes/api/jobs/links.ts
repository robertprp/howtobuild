import { createFileRoute } from '@tanstack/react-router'
import { collectLinkChecks } from '../../../features/operations/links.server'
import { approvedLinkHosts } from '../../../features/operations/link-check.server'
import { withCollectorLease } from '../../../features/github/store.server'

export const Route = createFileRoute('/api/jobs/links')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const headers = { 'Cache-Control': 'no-store' }
        const secret = process.env.CRON_SECRET
        if (
          !secret ||
          request.headers.get('authorization') !== `Bearer ${secret}`
        )
          return Response.json(
            { error: 'Unauthorized' },
            { status: 401, headers },
          )
        if (!approvedLinkHosts().size)
          return Response.json(
            { error: 'Link monitoring is not configured' },
            { status: 503, headers },
          )
        try {
          const result = await withCollectorLease(
            'link-monitor',
            collectLinkChecks,
          )
          return Response.json({ ok: true, result }, { headers })
        } catch {
          console.error(
            'Link monitoring failed; check database migration and job availability',
          )
          return Response.json(
            { error: 'Link monitoring failed' },
            { status: 503, headers },
          )
        }
      },
    },
  },
})
