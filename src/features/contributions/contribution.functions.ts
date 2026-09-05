import { createServerFn } from '@tanstack/react-start'
import { getRequest, setResponseHeaders } from '@tanstack/react-start/server'

import { categories, facets, session } from '../../db/schema'
import { getDb } from '../../db/client.server'
import { and, asc, desc, eq, gt } from 'drizzle-orm'
import { requireContributor } from './auth.server'
import { listContributorActivity, listModerationQueue } from './store.server'
import { requireEditor } from '../editorial/auth.server'

const privateHeaders = new Headers({
  'Cache-Control': 'private, no-store',
  Vary: 'Cookie, Authorization',
})

export const getContributionFormData = createServerFn({
  method: 'GET',
}).handler(async () => {
  setResponseHeaders(privateHeaders)
  const contributor = await requireContributor(getRequest())
  const [categoryRows, facetRows] = await Promise.all([
    getDb().select().from(categories).orderBy(asc(categories.sortOrder)),
    getDb().select().from(facets).orderBy(asc(facets.kind), asc(facets.name)),
  ])
  return { contributor, categories: categoryRows, facets: facetRows }
})

export const getAccountData = createServerFn({ method: 'GET' }).handler(
  async () => {
    setResponseHeaders(privateHeaders)
    const contributor = await requireContributor(getRequest())
    const sessions = await getDb()
      .select({
        id: session.id,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
      })
      .from(session)
      .where(
        and(
          eq(session.userId, contributor.id),
          gt(session.expiresAt, new Date()),
        ),
      )
      .orderBy(desc(session.createdAt))
    return {
      contributor,
      activity: await listContributorActivity(contributor.id),
      sessions,
    }
  },
)

export const getModerationData = createServerFn({ method: 'GET' }).handler(
  async () => {
    setResponseHeaders(privateHeaders)
    const editor = await requireEditor(getRequest())
    return { editor, ...(await listModerationQueue()) }
  },
)
