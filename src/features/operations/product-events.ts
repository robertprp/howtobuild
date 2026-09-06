import { telemetryRoute } from './telemetry'

export type ProductEvent =
  | 'page_view'
  | 'search_result_click'
  | 'outbound_click'
  | 'starter_copy'
  | 'starter_download'
  | 'sponsor_click'
  | 'sponsor_inquiry'
let sent = 0

// No identifiers, storage, queries, destinations, referrers or prompt content.
export function trackProductEvent(event: ProductEvent) {
  if (
    typeof window === 'undefined' ||
    import.meta.env.VITE_PRODUCT_ANALYTICS_ENABLED !== 'true'
  )
    return
  if (
    navigator.doNotTrack === '1' ||
    (navigator as Navigator & { globalPrivacyControl?: boolean })
      .globalPrivacyControl
  )
    return
  const path = telemetryRoute(window.location.pathname)
  if (path === '/other' || sent >= 60 || document.visibilityState !== 'visible')
    return
  sent++
  void fetch('/api/telemetry', {
    method: 'POST',
    credentials: 'omit',
    keepalive: true,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind: 'product', event, path }),
  }).catch(() => {})
}
