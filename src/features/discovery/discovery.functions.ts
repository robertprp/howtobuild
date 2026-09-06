import { createServerFn } from '@tanstack/react-start'
import { setResponseHeaders } from '@tanstack/react-start/server'
import { z } from 'zod'
import { eq } from 'drizzle-orm'

import { getDb } from '../../db/client.server'
import { categories, facets } from '../../db/schema'
import {
  listCategories,
  listPublishedProjects,
} from '../editorial/store.server'
import { searchDiscovery } from './search.server'
import { periodDelta } from '../github/period'

const publicHeaders = new Headers({
  'Cache-Control': 'public, max-age=0, must-revalidate',
  'CDN-Cache-Control': 'no-store',
})

const filterSchema = z.object({
  category: z.string().max(80).optional(),
  facet: z.string().max(80).optional(),
  type: z.string().max(80).optional(),
  pricing: z.string().max(80).optional(),
  openSource: z.boolean().optional(),
  selfHostable: z.boolean().optional(),
  signal: z.enum(['trending', 'recommended', 'watching']).optional(),
})

export const getSearchData = createServerFn({ method: 'GET' })
  .validator(
    z.object({
      query: z.string().max(120).default(''),
      filters: filterSchema.default({}),
    }),
  )
  .handler(async ({ data }) => {
    setResponseHeaders(publicHeaders)
    return searchDiscovery(data.query, data.filters)
  })

export const getTrendingData = createServerFn({ method: 'GET' })
  .validator(
    z.object({
      period: z.enum(['week', 'month', 'seven-weeks']).default('week'),
      filters: filterSchema.default({}),
    }),
  )
  .handler(async ({ data }) => {
    setResponseHeaders(publicHeaders)
    const [allProjects, allCategories] = await Promise.all([
      listPublishedProjects(data.filters.category),
      listCategories(),
    ])
    const projects = allProjects
      .filter((project) => {
        const momentum = project.momentum
        if (!momentum || ['stale', 'disabled'].includes(momentum.health))
          return false
        if (momentum.anomaly) return false
        if (momentum[periodDelta[data.period]] === null) return false
        if (
          data.filters.facet &&
          !project.facets.some((facet) => facet.slug === data.filters.facet)
        )
          return false
        if (data.filters.type && project.projectType !== data.filters.type)
          return false
        if (
          data.filters.pricing &&
          project.pricingLabel !== data.filters.pricing
        )
          return false
        if (
          data.filters.openSource !== undefined &&
          project.openSource !== data.filters.openSource
        )
          return false
        return true
      })
      .sort((a, b) => {
        const key = periodDelta[data.period]
        return (
          (b.momentum?.[key] ?? 0) - (a.momentum?.[key] ?? 0) ||
          a.name.localeCompare(b.name)
        )
      })
    return {
      period: data.period,
      filters: data.filters,
      projects,
      categories: allCategories,
      earlySignals: allProjects.filter(
        (project) =>
          project.momentum !== null &&
          project.momentum[periodDelta[data.period]] === null &&
          !project.momentum.anomaly &&
          !['stale', 'disabled'].includes(project.momentum.health),
      ),
    }
  })

export const getEcosystemData = createServerFn({ method: 'GET' })
  .validator(
    z.object({ category: z.string().max(80), ecosystem: z.string().max(80) }),
  )
  .handler(async ({ data }) => {
    setResponseHeaders(publicHeaders)
    const db = getDb()
    const [category, facet] = await Promise.all([
      db.query.categories.findFirst({
        where: eq(categories.slug, data.category),
      }),
      db.query.facets.findFirst({ where: eq(facets.slug, data.ecosystem) }),
    ])
    if (!category || !facet) return null
    const result = await searchDiscovery('', {
      category: data.category,
      facet: data.ecosystem,
    })
    if (result.projects.length === 0) return null
    return {
      category,
      facet,
      projects: result.projects,
      trending: result.projects
        .filter(
          (project) =>
            project.momentum != null &&
            project.momentum.score !== null &&
            !['stale', 'disabled'].includes(project.momentum.health) &&
            !project.momentum.anomaly,
        )
        .sort((a, b) => (b.momentum?.score ?? 0) - (a.momentum?.score ?? 0)),
      recommended: result.projects.filter((project) => project.recommended),
      watching: result.projects.filter((project) => project.worthWatching),
      established: result.projects.filter(
        (project) => !project.recommended && !project.worthWatching,
      ),
    }
  })
