import { ORPCError, os } from '@orpc/server'
import { z } from 'zod'

import { requireEditor } from '../features/editorial/auth.server'
import { projectDraftSchema } from '../features/editorial/model'
import { saveDraft, setPublication } from '../features/editorial/store.server'
import { setRepositoryExclusion } from '../features/github/metrics.server'

type RpcContext = { request: Request }

const editorProcedure = os
  .$context<RpcContext>()
  .use(async ({ context, next }) => {
    try {
      const editor = await requireEditor(context.request)
      return next({ context: { editor } })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'UNAUTHORIZED'
      throw new ORPCError(
        message === 'FORBIDDEN' ? 'FORBIDDEN' : 'UNAUTHORIZED',
      )
    }
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
