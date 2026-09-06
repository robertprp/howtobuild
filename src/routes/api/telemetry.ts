import { createFileRoute } from '@tanstack/react-router'
import {
  telemetryRoute,
  telemetrySchema,
} from '../../features/operations/telemetry'

const maxPayloadBytes = 16_384

export const Route = createFileRoute('/api/telemetry')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (request.headers.get('sec-fetch-site') === 'cross-site')
          return new Response(null, { status: 403 })
        const contentLength = Number(request.headers.get('content-length') ?? 0)
        if (contentLength > maxPayloadBytes)
          return new Response(null, { status: 413 })
        const reader = request.body?.getReader()
        if (!reader) return new Response(null, { status: 400 })
        let raw = ''
        let size = 0
        const deadline = Date.now() + 2000
        const timer = setTimeout(() => {
          void reader.cancel().catch(() => {})
        }, 2000)
        const decoder = new TextDecoder()
        try {
          while (size <= maxPayloadBytes) {
            const chunk = await reader.read()
            if (Date.now() >= deadline)
              return new Response(null, { status: 408 })
            if (chunk.done) break
            size += chunk.value.byteLength
            if (size > maxPayloadBytes) {
              await reader.cancel()
              return new Response(null, { status: 413 })
            }
            raw += decoder.decode(chunk.value, { stream: true })
          }
          raw += decoder.decode()
        } catch {
          return new Response(null, { status: 400 })
        } finally {
          clearTimeout(timer)
          reader.releaseLock()
        }
        let event: unknown
        try {
          event = JSON.parse(raw)
        } catch {
          return new Response(null, { status: 400 })
        }
        const parsed = telemetrySchema.safeParse(event)
        if (!parsed.success) return new Response(null, { status: 400 })
        const record = {
          service: 'howtobuild-web',
          receivedAt: new Date().toISOString(),
          event: { ...parsed.data, path: telemetryRoute(parsed.data.path) },
        }
        const ingestUrl = process.env.OBSERVABILITY_INGEST_URL
        if (ingestUrl) {
          try {
            const response = await fetch(ingestUrl, {
              method: 'POST',
              redirect: 'error',
              signal: AbortSignal.timeout(2000),
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
            await response.body?.cancel()
            if (!response.ok) console.error('telemetry.forward.failed')
          } catch {
            console.error('telemetry.forward.failed')
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
