import { createFileRoute } from '@tanstack/react-router'
import { deliverTelemetry } from '../../features/operations/telemetry-sink.server'
import {
  telemetryRoute,
  telemetrySchema,
} from '../../features/operations/telemetry'

const maxPayloadBytes = 16_384
// Bounded, identifier-free protection for downstream log volume. Per-instance
// only: production WAF limits are still needed; this does not prove humanity.
let productWindow = 0
let productCount = 0

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
        if (parsed.data.kind === 'product') {
          if (process.env.PRODUCT_ANALYTICS_ENABLED !== 'true')
            return new Response(null, { status: 204 })
          if (request.headers.get('origin') !== new URL(request.url).origin)
            return new Response(null, { status: 403 })
          if (
            request.headers.get('dnt') === '1' ||
            request.headers.get('sec-gpc') === '1'
          )
            return new Response(null, { status: 204 })
          const window = Math.floor(Date.now() / 60_000)
          if (window !== productWindow) {
            productWindow = window
            productCount = 0
          }
          if (++productCount > 1000)
            return new Response(null, {
              status: 429,
              headers: { 'Retry-After': '60', 'Cache-Control': 'no-store' },
            })
        }
        const record = {
          service: 'howtobuild-web',
          receivedAt: new Date().toISOString(),
          event: { ...parsed.data, path: telemetryRoute(parsed.data.path) },
        }
        await deliverTelemetry(record)
        return new Response(null, {
          status: 202,
          headers: { 'Cache-Control': 'no-store' },
        })
      },
    },
  },
})
