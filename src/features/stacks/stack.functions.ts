import { createServerFn } from '@tanstack/react-start'
import { setResponseHeaders } from '@tanstack/react-start/server'
import { z } from 'zod'

import { findPublishedStack, listPublishedStacks } from './store.server'

const publicHeaders = new Headers({
  'Cache-Control': 'public, max-age=0, must-revalidate',
  'CDN-Cache-Control': 'no-store',
})

export const getStacksData = createServerFn({ method: 'GET' }).handler(
  async () => {
    setResponseHeaders(publicHeaders)
    return listPublishedStacks()
  },
)

export const getStackData = createServerFn({ method: 'GET' })
  .validator(z.object({ slug: z.string().min(2).max(80) }))
  .handler(async ({ data }) => {
    setResponseHeaders(publicHeaders)
    return findPublishedStack(data.slug)
  })
