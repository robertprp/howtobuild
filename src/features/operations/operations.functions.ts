import { createServerFn } from '@tanstack/react-start'
import { getRequest, setResponseHeaders } from '@tanstack/react-start/server'
import { requireEditor } from '../editorial/auth.server'
import { getOperationsSnapshot } from './dashboard.server'
import { getLinkReport } from './links.server'

export const getOperationsData = createServerFn({ method: 'GET' }).handler(
  async () => {
    setResponseHeaders(
      new Headers({
        'Cache-Control': 'private, no-store',
        'CDN-Cache-Control': 'no-store',
        Vary: 'Cookie, Authorization',
      }),
    )
    await requireEditor(getRequest())
    return getOperationsSnapshot()
  },
)

export const getLinkReportData = createServerFn({ method: 'GET' }).handler(
  async () => {
    setResponseHeaders(
      new Headers({
        'Cache-Control': 'private, no-store',
        'CDN-Cache-Control': 'no-store',
        Vary: 'Cookie, Authorization',
      }),
    )
    await requireEditor(getRequest())
    return getLinkReport()
  },
)
