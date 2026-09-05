import { ORPCError, os } from '@orpc/server'
import { z } from 'zod'

import { requireEditor } from '../features/editorial/auth.server'
import { projectDraftSchema } from '../features/editorial/model'
import { saveDraft, setPublication } from '../features/editorial/store.server'
import { setRepositoryExclusion } from '../features/github/metrics.server'
import { auth } from '../lib/auth.server'
import { getDb } from '../db/client.server'
import { session } from '../db/schema'
import { and, eq } from 'drizzle-orm'
import {
  editSuggestionSchema,
  moderationStatusSchema,
  submissionSchema,
  responseSchema,
} from '../features/contributions/model'
import {
  createAbuseReport,
  createEditSuggestion,
  createSubmission,
  moderateContribution,
  parseGithubRepository,
  respondToReview,
  prepareSubmissionDraft,
  completeSuggestion,
  resolveAbuseReport,
} from '../features/contributions/store.server'
import { limitContribution } from '../features/contributions/limits.server'

type RpcContext = { request: Request }

const editorProcedure = os
  .$context<RpcContext>()
  .use(async ({ context, next }) => {
    try {
      const editor = await requireEditor(context.request)
      return next({ context: { editor } })
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      if (message !== 'FORBIDDEN' && message !== 'UNAUTHORIZED') throw error
      throw new ORPCError(
        message === 'FORBIDDEN' ? 'FORBIDDEN' : 'UNAUTHORIZED',
      )
    }
  })

const contributorProcedure = os
  .$context<RpcContext>()
  .use(async ({ context, next }) => {
    const authSession = await auth.api.getSession({
      headers: context.request.headers,
    })
    if (!authSession?.user) throw new ORPCError('UNAUTHORIZED')
    if (!authSession.user.emailVerified)
      throw new ORPCError('FORBIDDEN', {
        message: 'Verify your email before contributing.',
      })
    return next({
      context: {
        contributor: {
          id: authSession.user.id,
          email: authSession.user.email,
          name: authSession.user.name,
        },
        request: context.request,
      },
    })
  })

export const appRouter = {
  system: {
    health: os.handler(() => ({
      ok: true as const,
      runtime: 'server',
      checkedAt: new Date().toISOString(),
    })),
    echo: os
      .input(z.object({ message: z.string().trim().min(1).max(120) }))
      .handler(({ input }) => ({
        accepted: true as const,
        normalized: input.message.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-'),
      })),
  },
  editorial: {
    saveDraft: editorProcedure
      .input(projectDraftSchema)
      .handler(({ input, context }) => saveDraft(input, context.editor)),
    setPublication: editorProcedure
      .input(
        z.object({
          projectId: z.string().uuid(),
          publish: z.boolean(),
          reason: z.string().trim().min(8).max(300),
        }),
      )
      .handler(({ input, context }) =>
        setPublication(
          input.projectId,
          input.publish,
          input.reason,
          context.editor,
        ),
      ),
  },
  contributions: {
    revokeSession: contributorProcedure
      .input(z.object({ sessionId: z.string().min(1) }))
      .handler(async ({ input, context }) => {
        const owned = (
          await getDb()
            .select({ token: session.token })
            .from(session)
            .where(
              and(
                eq(session.id, input.sessionId),
                eq(session.userId, context.contributor.id),
              ),
            )
        ).at(0)
        if (!owned) throw new ORPCError('NOT_FOUND')
        await auth.api.revokeSession({
          headers: context.request.headers,
          body: { token: owned.token },
        })
        return { revoked: true as const }
      }),
    inspectRepository: contributorProcedure
      .input(z.object({ repositoryUrl: z.string().url().max(300) }))
      .handler(async ({ input, context }) => {
        await limitContribution(
          context.request,
          context.contributor.id,
          'repository-lookup',
          20,
          60,
        )
        const coordinate = parseGithubRepository(input.repositoryUrl)
        const response = await fetch(
          `https://api.github.com/repos/${coordinate.owner}/${coordinate.name}`,
          {
            signal: AbortSignal.timeout(8000),
            redirect: 'error',
            headers: {
              Accept: 'application/vnd.github+json',
              'X-GitHub-Api-Version': '2022-11-28',
            },
          },
        )
        if (!response.ok)
          throw new ORPCError(
            response.status === 404 ? 'NOT_FOUND' : 'BAD_GATEWAY',
          )
        const data = (await response.json()) as {
          name?: string
          description?: string
          homepage?: string
          html_url?: string
          language?: string
          license?: { spdx_id?: string } | null
          private?: boolean
        }
        if (data.private) throw new ORPCError('NOT_FOUND')
        return {
          repositoryUrl: data.html_url ?? coordinate.url,
          name: data.name ?? coordinate.name,
          description: data.description ?? '',
          website: data.homepage ?? '',
          language: data.language ?? '',
          license: data.license?.spdx_id ?? '',
        }
      }),
    submitProject: contributorProcedure
      .input(submissionSchema)
      .handler(({ input, context }) =>
        createSubmission(input, context.contributor, context.request),
      ),
    respond: contributorProcedure
      .input(responseSchema)
      .handler(({ input, context }) =>
        respondToReview(input, context.contributor, context.request),
      ),
    prepareDraft: editorProcedure
      .input(z.object({ id: z.string().uuid() }))
      .handler(({ input, context }) =>
        prepareSubmissionDraft(input.id, context.editor),
      ),
    completeSuggestion: editorProcedure
      .input(
        z.object({
          id: z.string().uuid(),
          reason: z.string().trim().min(8).max(500),
        }),
      )
      .handler(({ input, context }) =>
        completeSuggestion(input.id, input.reason, context.editor),
      ),
    resolveAbuse: editorProcedure
      .input(
        z.object({
          id: z.string().uuid(),
          reason: z.string().trim().min(8).max(500),
        }),
      )
      .handler(({ input, context }) =>
        resolveAbuseReport(input.id, input.reason, context.editor),
      ),
    suggestEdit: contributorProcedure
      .input(editSuggestionSchema)
      .handler(({ input, context }) =>
        createEditSuggestion(input, context.contributor, context.request),
      ),
    reportAbuse: contributorProcedure
      .input(
        z.object({
          projectId: z.string().uuid().optional(),
          pageUrl: z
            .string()
            .trim()
            .min(1)
            .max(500)
            .refine(
              (value) =>
                value.startsWith('/') &&
                !value.startsWith('//') &&
                !/[\\\s]/.test(value),
              'Use a local page path.',
            ),
          reason: z.string().trim().min(3).max(80),
          details: z.string().trim().min(20).max(1500),
        }),
      )
      .handler(({ input, context }) =>
        createAbuseReport(input, context.contributor, context.request),
      ),
    moderate: editorProcedure
      .input(
        z.object({
          kind: z.enum(['submission', 'suggestion']),
          id: z.string().uuid(),
          status: moderationStatusSchema,
          reason: z.string().trim().min(8).max(500),
        }),
      )
      .handler(({ input, context }) =>
        moderateContribution(input, context.editor),
      ),
  },
  metrics: {
    setRepositoryExclusion: editorProcedure
      .input(
        z.object({
          repositoryId: z.string().uuid(),
          excluded: z.boolean(),
          reason: z.string().trim().min(8).max(300),
        }),
      )
      .handler(({ input, context }) =>
        setRepositoryExclusion(
          input.repositoryId,
          input.excluded,
          input.reason,
          context.editor,
        ),
      ),
  },
}

export type AppRouter = typeof appRouter
