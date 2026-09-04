import { useEffect } from 'react'

type Metric = { name: string; value: number }

export function Telemetry() {
  useEffect(() => {
    const endpoint = '/api/telemetry'
    const metrics = new Map<string, number>()
    const observers: PerformanceObserver[] = []

    const observe = (
      type: string,
      handler: (entries: PerformanceEntry[]) => void,
    ) => {
      try {
        const observer = new PerformanceObserver((list) =>
          handler(list.getEntries()),
        )
        observer.observe({ type, buffered: true })
        observers.push(observer)
      } catch {
        // Older browsers simply omit unsupported measurements.
      }
    }

    observe('largest-contentful-paint', (entries) => {
      const latest = entries.at(-1)
      if (latest) metrics.set('LCP', latest.startTime)
    })
    observe('layout-shift', (entries) => {
      const total = entries.reduce(
        (sum, entry) => {
          const shift = entry as PerformanceEntry & {
            value?: number
            hadRecentInput?: boolean
          }
          return sum + (shift.hadRecentInput ? 0 : (shift.value ?? 0))
        },
        metrics.get('CLS') ?? 0,
      )
      metrics.set('CLS', total)
    })
    observe('event', (entries) => {
      const longest = entries.reduce(
        (value, entry) => Math.max(value, entry.duration),
        metrics.get('INP') ?? 0,
      )
      metrics.set('INP', longest)
    })

    const send = (payload: Record<string, unknown>) => {
      const body = JSON.stringify({
        path: window.location.pathname,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        ...payload,
      })
      if (!navigator.sendBeacon(endpoint, body))
        void fetch(endpoint, {
          method: 'POST',
          body,
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
        })
    }
    const reportError = (event: ErrorEvent) =>
      send({
        kind: 'error',
        message: event.message.slice(0, 500),
        source: event.filename,
        line: event.lineno,
      })
    const reportRejection = (event: PromiseRejectionEvent) =>
      send({
        kind: 'unhandled-rejection',
        message: String(event.reason).slice(0, 500),
      })
    const flush = () => {
      if (document.visibilityState !== 'hidden' || metrics.size === 0) return
      send({
        kind: 'web-vitals',
        metrics: Array.from(metrics, ([name, value]): Metric => ({
          name,
          value: Math.round(value * 1000) / 1000,
        })),
      })
      metrics.clear()
    }

    window.addEventListener('error', reportError)
    window.addEventListener('unhandledrejection', reportRejection)
    document.addEventListener('visibilitychange', flush)
    return () => {
      observers.forEach((observer) => observer.disconnect())
      window.removeEventListener('error', reportError)
      window.removeEventListener('unhandledrejection', reportRejection)
      document.removeEventListener('visibilitychange', flush)
    }
  }, [])
  return null
}
