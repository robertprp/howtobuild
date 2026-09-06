import { telemetryRoute } from './telemetry'
import type { Metric } from 'web-vitals'

let started = false

// Called only from a client effect; importing this module is SSR-safe.
// Document-scoped: React remounts and SPA navigation must not duplicate observers.
export function startTelemetry() {
  if (started) return
  started = true
  const entryPath = telemetryRoute(window.location.pathname)
  const entryViewport = `${window.innerWidth}x${window.innerHeight}`
  let sequence = 0
  let errorCount = 0
  const send = (payload: Record<string, unknown>) => {
    try {
      const body = JSON.stringify(payload)
      if (
        typeof navigator.sendBeacon === 'function' &&
        navigator.sendBeacon('/api/telemetry', body)
      )
        return
      void fetch('/api/telemetry', {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
      }).catch(() => {})
    } catch {
      // Reporting must not cause a new error/rejection loop.
    }
  }
  const reportMetric = (metric: Metric) => {
    let path = entryPath
    if (metric.navigationURL) {
      try {
        path = telemetryRoute(
          new URL(metric.navigationURL, window.location.origin).pathname,
        )
      } catch {
        /* Keep the document entry group. */
      }
    }
    send({
      kind: 'web-vitals',
      source: 'web-vitals/6.2.1',
      path,
      viewport: entryViewport,
      metrics: [
        {
          name: metric.name,
          value: metric.value,
          id: metric.id,
          sequence: ++sequence,
          navigationType: metric.navigationType,
        },
      ],
    })
  }
  // No attribution build: DOM selectors, resource URLs, and text are not sent.
  void import('web-vitals')
    .then(({ onCLS, onINP, onLCP }) => {
      onCLS(reportMetric)
      onINP(reportMetric)
      onLCP(reportMetric)
    })
    .catch(() => {})
  const reportError = (kind: 'error' | 'unhandled-rejection') => {
    if (errorCount++ >= 20) return
    send({
      kind,
      path: telemetryRoute(window.location.pathname),
      viewport: `${window.innerWidth}x${window.innerHeight}`,
    })
  }
  window.addEventListener('error', () => reportError('error'))
  window.addEventListener('unhandledrejection', () =>
    reportError('unhandled-rejection'),
  )
}
