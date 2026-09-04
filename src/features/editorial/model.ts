import { z } from 'zod'

export const projectStatusSchema = z.enum(['draft', 'published', 'archived'])

export const projectDraftSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().trim().min(2).max(100),
  shortDescription: z.string().trim().min(20).max(180),
  editorialDescription: z.string().trim().min(40).max(2_000),
  whyInteresting: z.string().trim().min(30).max(700),
  bestFor: z.array(z.string().trim().min(8).max(180)).min(1).max(6),
  notIdealFor: z.array(z.string().trim().min(8).max(180)).min(1).max(6),
  projectType: z.string().trim().min(2).max(50),
  categoryId: z.string().uuid(),
  openSource: z.boolean(),
  license: z.string().trim().max(80).nullable(),
  selfHostable: z.boolean(),
  pricingLabel: z.enum([
    'Unknown',
    'Open Source',
    'Free',
    'Generous Free Tier',
    'Limited Free Tier',
    'Paid',
    'Enterprise',
  ]),
  pricingSummary: z.string().trim().min(15).max(500),
  recommended: z.boolean(),
  worthWatching: z.boolean(),
  links: z
    .array(
      z.object({
        kind: z.enum(['website', 'documentation', 'repository', 'pricing']),
        url: z.string().url().startsWith('https://'),
      }),
    )
    .min(2)
    .max(4),
  sources: z
    .array(
      z.object({
        claim: z.string().trim().min(10).max(300),
        sourceType: z.enum(['maintainer', 'automated', 'editorial']),
        url: z.string().url().startsWith('https://'),
      }),
    )
    .min(1)
    .max(12),
  reason: z.string().trim().min(8).max(300),
})

export type ProjectDraft = z.infer<typeof projectDraftSchema>

export type PublicProject = {
  id: string
  slug: string
  name: string
  shortDescription: string
  editorialDescription: string
  whyInteresting: string
  bestFor: string[]
  notIdealFor: string[]
  projectType: string
  status: string
  openSource: boolean
  license: string | null
  selfHostable: boolean
  pricingLabel: string
  pricingSummary: string
  recommended: boolean
  worthWatching: boolean
  publishedAt: string | null
  updatedAt: string
  category: { id: string; slug: string; name: string; accent: string }
  links: Array<{ kind: string; url: string }>
  sources: Array<{
    claim: string
    sourceType: string
    url: string
    checkedAt: string
    checkedBy: string | null
  }>
  facets: Array<{ id: string; kind: string; slug: string; name: string }>
  momentum: PublicMomentum | null
}

export type MetricHealth = 'healthy' | 'delayed' | 'stale' | 'disabled'

export type PublicMomentum = {
  stars: number
  absolute7d: number | null
  absolute30d: number | null
  relative7d: number | null
  relative30d: number | null
  score: number | null
  confidence: 'early' | 'weekly' | 'complete'
  windowStart: string | null
  windowEnd: string
  anomaly: boolean
  algorithmVersion: string
  health: MetricHealth
}

export function metricHealth(input: {
  lastSyncedAt: Date | string | null
  archived?: boolean
  private?: boolean
  manuallyExcluded?: boolean
  syncStatus?: string
  now?: Date
}): MetricHealth {
  if (
    input.archived ||
    input.private ||
    input.manuallyExcluded ||
    input.syncStatus === 'disabled'
  )
    return 'disabled'
  if (!input.lastSyncedAt) return 'stale'
  const ageHours =
    ((input.now ?? new Date()).getTime() -
      new Date(input.lastSyncedAt).getTime()) /
    3_600_000
  if (ageHours <= 30) return 'healthy'
  if (ageHours <= 72) return 'delayed'
  return 'stale'
}

const publishRequiredKeys = [
  'name',
  'shortDescription',
  'editorialDescription',
  'whyInteresting',
  'pricingSummary',
] as const

export function validatePublishable(
  project: Pick<ProjectDraft, (typeof publishRequiredKeys)[number]> &
    Pick<ProjectDraft, 'bestFor' | 'notIdealFor' | 'links' | 'sources'>,
) {
  const missing = publishRequiredKeys.filter((key) => !project[key].trim())
  if (!project.bestFor.length) missing.push('bestFor' as never)
  if (!project.notIdealFor.length) missing.push('notIdealFor' as never)
  if (!project.links.some((link) => link.kind === 'website'))
    missing.push('links' as never)
  if (!project.sources.length) missing.push('sources' as never)
  return missing
}

export function canEditRole(role: string | null | undefined) {
  return role === 'editor' || role === 'admin'
}
