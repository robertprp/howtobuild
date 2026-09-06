import { z } from 'zod'

// Store only coarse route groups, never paths containing user-controlled data.
export function telemetryRoute(path: string) {
  const first = path.split('/')[1]
  return [
    'guides',
    'stacks',
    'projects',
    'search',
    'trending',
    'frontend',
    'backend',
    'mobile',
    'devops',
    'observability',
    'ai-tools',
  ].includes(first)
    ? `/${first}`
    : path === '/'
      ? '/'
      : '/other'
}

export const telemetrySchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('web-vitals'),
    source: z.literal('web-vitals/6.2.1'),
    path: z.string().max(2000),
    viewport: z.string().regex(/^\d{1,5}x\d{1,5}$/),
    metrics: z
      .array(
        z.object({
          name: z.enum(['LCP', 'CLS', 'INP']),
          value: z.number().finite().min(0).max(86_400_000),
          id: z
            .string()
            .min(1)
            .max(100)
            .regex(/^[a-zA-Z0-9-]+$/),
          sequence: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
          navigationType: z.enum([
            'navigate',
            'reload',
            'back-forward',
            'back-forward-cache',
            'prerender',
            'restore',
            'soft-navigation',
          ]),
        }),
      )
      .min(1)
      .max(3),
  }),
  z.object({
    kind: z.enum(['error', 'unhandled-rejection']),
    path: z.string().max(2000),
    viewport: z.string().regex(/^\d{1,5}x\d{1,5}$/),
  }),
])
