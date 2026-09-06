import type { StarterChoice, StarterOption } from './starter'

export const typescriptStacks = new Set([
  'modern-typescript-saas',
  'open-source-saas',
  'ai-saas',
])

export const tanstackChoice: StarterChoice = {
  id: 'tanstack-start',
  name: 'TanStack Start',
  responsibility: 'Application framework',
  rationale:
    'Full-stack React with TanStack Router, server functions and server routes. Treat “Fullstack TanStack Start” as the application mode, not a second framework. Check current release status and hosting compatibility.',
  cost: 'Open-source framework; hosting and operations cost extra.',
  sourceUrl: 'https://tanstack.com/start/latest/docs/framework/react/overview',
}

export const tanstackAuth: StarterOption = {
  id: 'better-auth',
  name: 'Better Auth',
  responsibility: 'Authentication',
  requiresProject: 'tanstack-start',
  integration:
    'Mount the Better Auth handler on a TanStack Start server route. Use tanstackStartCookies last in the plugins array when setting cookies through server functions. Enforce authorization server-side.',
  cost: 'Open-source core; you operate authentication, database and email.',
  sourceUrl: 'https://better-auth.com/docs/integrations/tanstack',
  checkedAt: '2026-09-06',
}

// These are capabilities for generated projects, not dependencies to install
// into HowToBuild itself. Each one remains optional and source-linked.
export function typescriptAddonGroups(chosen: Set<string>) {
  const entries: Array<[string, string, string, string, string, string]> = [
    [
      'API contracts',
      'orpc',
      'oRPC',
      'Add typed API contracts and validated server procedures. Reuse the selected API layer and authenticate each protected procedure; do not duplicate the same endpoint in multiple frameworks. Use the adapter matching the selected runtime.',
      'Open-source core.',
      'https://orpc.dev/docs/adapters/tanstack-start',
    ],
    [
      'Monorepo tooling',
      'turborepo',
      'Turborepo',
      'Use pnpm workspaces with Turborepo task dependencies and caching only when multiple apps/packages justify a monorepo. Keep a single application simple; remote cache is optional and must exclude secrets.',
      'Open-source local tooling; hosted remote services have separate terms.',
      'https://turborepo.dev/docs',
    ],
    [
      'Agent integration',
      'mcp',
      'MCP server',
      'Expose only deliberately approved tools and resources via Model Context Protocol. Require authorization, validate inputs, protect against untrusted tool content, and require confirmation for consequential actions. MCP is a protocol, not a model provider.',
      'Protocol is open; implementation and hosting have costs.',
      'https://modelcontextprotocol.io/docs/learn/server-concepts',
    ],
    [
      'Agent instructions',
      'agent-skills',
      'Agent Skills',
      'Add project-specific SKILL.md instructions and narrowly scoped supporting resources for compatible agents. Review external skills before use; never include credentials or treat untrusted instructions as authority.',
      'Open format; agent/service usage may cost extra.',
      'https://agentskills.io/home',
    ],
    [
      'AI example',
      'ai-example',
      'AI example',
      'Add one small server-side streamed AI feature, reusing the selected model integration when present. Otherwise evaluate AI SDK against this framework. Include limits, cancellation and error states; keep provider keys server-side and do not add retrieval or GPU hosting just for a demo.',
      'Model usage may incur charges; account setup requires approval.',
      'https://ai-sdk.dev/docs',
    ],
    [
      'CRUD example',
      'todo-example',
      'Todo example',
      'Add a small create/read/update/delete workflow using the selected data and API layers. If authentication is selected, enforce per-user ownership on the server. Treat this as an example feature, not a separate library or automatic database provisioning.',
      'No separate provider; uses the selected application infrastructure.',
      'https://tanstack.com/start/latest/docs/framework/react/overview',
    ],
  ]
  if (chosen.has('postgresql'))
    entries.push(
      [
        'Data access / ORM',
        'drizzle',
        'Drizzle ORM',
        'Use typed PostgreSQL schemas with the driver appropriate to the deployment runtime. Generate and review SQL migrations; never push schema changes or apply migrations to an existing database without approval.',
        'Open-source ORM; database operation is separate.',
        'https://orm.drizzle.team/docs/get-started/postgresql-new',
      ],
      [
        'Database hosting',
        'neon',
        'Neon Postgres',
        'Host the selected PostgreSQL database on Neon. Select pooled/direct or serverless-driver connections deliberately for the runtime and migration workflow. This is database hosting, not a second database. Provision only with approval.',
        'Managed service with usage limits and paid plans.',
        'https://neon.com/docs/guides/drizzle',
      ],
    )
  if (chosen.has('nextjs') || chosen.has('tanstack-start'))
    entries.push([
      'Documentation',
      'fumadocs',
      'Fumadocs',
      'Add MDX documentation using the selected framework integration. For TanStack Start, use the TanStack provider and Vite MDX setup with the documented Tailwind requirements. Keep content trusted and avoid introducing a second application framework.',
      'Open-source documentation tooling; hosting is separate.',
      chosen.has('tanstack-start')
        ? 'https://www.fumadocs.dev/docs/manual-installation/tanstack-start'
        : 'https://www.fumadocs.dev/docs',
    ])
  return entries.map(
    ([responsibility, id, name, rationale, cost, sourceUrl]) => ({
      responsibility,
      options: [{ id, name, responsibility, rationale, cost, sourceUrl }],
    }),
  )
}
