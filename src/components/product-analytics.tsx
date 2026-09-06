import { useEffect, useRef } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { trackProductEvent } from '../features/operations/product-events'

export function ProductAnalytics() {
  const path = useRouterState({ select: (state) => state.location.pathname })
  const lastRecordedPath = useRef<string | null>(null)
  useEffect(() => {
    let recorded = false
    const record = () => {
      if (
        !recorded &&
        lastRecordedPath.current !== path &&
        document.visibilityState === 'visible'
      ) {
        recorded = true
        lastRecordedPath.current = path
        trackProductEvent('page_view')
      }
    }
    record()
    document.addEventListener('visibilitychange', record)
    return () => document.removeEventListener('visibilitychange', record)
  }, [path])
  useEffect(() => {
    const click = (event: MouseEvent) => {
      if (!event.isTrusted || !(event.target instanceof Element)) return
      const link = event.target.closest('a[href]')
      if (!(link instanceof HTMLAnchorElement)) return
      if (link.dataset.sponsor === 'true') trackProductEvent('sponsor_click')
      else if (link.dataset.sponsorInquiry === 'true')
        trackProductEvent('sponsor_inquiry')
      else if (
        window.location.pathname === '/search' &&
        link.closest('[data-search-results]')
      )
        trackProductEvent('search_result_click')
      else if (
        link.protocol === 'https:' &&
        link.origin !== window.location.origin
      )
        trackProductEvent('outbound_click')
    }
    document.addEventListener('click', click)
    return () => document.removeEventListener('click', click)
  }, [])
  return null
}
