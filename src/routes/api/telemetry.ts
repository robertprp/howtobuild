import { createFileRoute } from '@tanstack/react-router'

const maxPayloadBytes = 16_384

export const Route = createFileRoute('/api/telemetry')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const contentLength = Number(request.headers.get('content-length') ?? 0)
        if (contentLength > maxPayloadBytes)
          return new Response(null, { status: 413 })
        const raw = await request.text()
        if (raw.length > maxPayloadBytes)
          return new Response(null, { status: 413 })
        let event: unknown
        try {
          event = JSON.parse(raw)
        } catch {
          return new Response(null, { status: 400 })
        }
        const record = {
          service: 'howtobuild-web',
          receivedAt: new Date().toISOString(),
          event,
        }
        const ingestUrl = process.env.OBSERVABILITY_INGEST_URL
        if (ingestUrl) {
          try {
            await fetch(ingestUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(process.env.OBSERVABILITY_INGEST_TOKEN
                  ? {
                      Authorization: `Bearer ${process.env.OBSERVABILITY_INGEST_TOKEN}`,
                    }
                  : {}),
              },
              body: JSON.stringify(record),
            })
          } catch (error) {
            console.error('telemetry.forward.failed', error)
          }
        } else {
          console.info('telemetry.event', record)
        }
        return new Response(null, {
          status: 202,
          headers: { 'Cache-Control': 'no-store' },
        })
      },
    },
  },
})
