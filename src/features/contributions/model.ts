import { z } from 'zod'

const httpsUrl = z.string().trim().url().startsWith('https://')

export const submissionSchema = z.object({
  repositoryUrl: httpsUrl,
  name: z.string().trim().min(2).max(100),
  website: httpsUrl.optional().or(z.literal('')),
  documentation: httpsUrl.optional().or(z.literal('')),
  shortExplanation: z.string().trim().min(30).max(500),
  categoryId: z.string().uuid(),
  projectType: z.string().trim().min(2).max(60),
  ecosystems: z.array(z.string().trim().min(1).max(50)).max(12),
  whyInteresting: z.string().trim().min(30).max(1_000),
  pricingInformation: z.string().trim().min(10).max(600),
  openSourceInformation: z.string().trim().min(10).max(600),
  startedAt: z.number().int().positive(),
  websiteField: z.string().max(0),
})

export const editSuggestionSchema = z.object({
  projectId: z.string().uuid(),
  summary: z.string().trim().min(20).max(300),
  proposedChanges: z.string().trim().min(30).max(2_000),
  sourceUrl: httpsUrl,
  startedAt: z.number().int().positive(),
  websiteField: z.string().max(0),
})

export const moderationStatusSchema = z.enum([
  'submitted',
  'under_review',
  'changes_requested',
  'approved',
  'published',
  'rejected',
])

export const responseSchema = z.object({
  kind: z.enum(['submission', 'suggestion']),
  id: z.string().uuid(),
  message: z.string().trim().min(30).max(4000),
})

export type SubmissionInput = z.infer<typeof submissionSchema>
export type EditSuggestionInput = z.infer<typeof editSuggestionSchema>
