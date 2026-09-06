import type { PublicStack } from '../editorial/model'
import { optionalStarterGroups } from './addons'
import {
  tanstackAuth,
  tanstackChoice,
  typescriptStacks,
} from './typescript-options'

export type StarterOption = {
  id: string
  name: string
  responsibility: string
  integration: string
  cost: string
  sourceUrl: string
  checkedAt: string
  requiresProject: string
}

export type StarterChoice = {
  omitted?: boolean
  id: string
  name: string
  responsibility: string
  rationale: string
  cost: string
  sourceUrl: string
}

export function starterGroups(
  stack: PublicStack,
  selections: Record<string, string>,
) {
  const base = stack.items.map((item) => ({
    responsibility: item.responsibility,
    options: [
      {
        id: item.project.slug,
        name: item.project.name,
        responsibility: item.responsibility,
        rationale: item.rationale,
        cost: item.project.pricingLabel,
        sourceUrl: `https://howtobuild.dev/projects/${item.project.slug}`,
      },
      ...item.alternatives.map((alternative) => ({
        id: alternative.project.slug,
        name: alternative.project.name,
        responsibility: item.responsibility,
        rationale: alternative.rationale,
        cost: alternative.project.pricingLabel,
        sourceUrl: `https://howtobuild.dev/projects/${alternative.project.slug}`,
      })),
    ],
  }))
  if (typescriptStacks.has(stack.slug)) {
    const framework = base.find((group) =>
      ['Application framework', 'Web application'].includes(
        group.responsibility,
      ),
    )
    if (
      framework &&
      !framework.options.some((choice) => choice.id === tanstackChoice.id)
    ) {
      framework.options.push({
        ...tanstackChoice,
        responsibility: framework.responsibility,
      })
    }
  }
  const chosenProjects = new Set(
    base.map(
      (group) =>
        group.options.find(
          (option) => option.id === selections[group.responsibility],
        )?.id ?? group.options[0].id,
    ),
  )
  for (const option of [
    ...stack.starterOptions,
    ...(typescriptStacks.has(stack.slug) ? [tanstackAuth] : []),
  ]) {
    if (!chosenProjects.has(option.requiresProject)) continue
    const choice: StarterChoice = { ...option, rationale: option.integration }
    const group = base.find(
      (item) => item.responsibility === option.responsibility,
    )
    if (group) {
      const existing = group.options.findIndex((item) => item.id === choice.id)
      if (existing >= 0) group.options[existing] = choice
      else group.options.push(choice)
    } else
      base.push({ responsibility: option.responsibility, options: [choice] })
  }
  return [
    ...base,
    ...optionalStarterGroups(stack.slug, chosenProjects).filter(
      (group) =>
        !base.some((item) => item.responsibility === group.responsibility),
    ),
  ]
}

export function buildStarterPrompt(
  stack: PublicStack,
  choices: StarterChoice[],
  purpose: string,
) {
  const usesNext = choices.some((choice) => choice.id === 'nextjs')
  const usesTanstack = choices.some((choice) => choice.id === 'tanstack-start')
  const usesTypescript =
    typescriptStacks.has(stack.slug) || usesNext || usesTanstack
  return [
    `# Build with ${stack.name}`,
    '',
    `Product brief: ${purpose.trim() || stack.summary}`,
    `Target user: ${stack.targetUser}`,
    '',
    '## Selected technologies',
    ...(usesTypescript
      ? [
          '- Language: TypeScript with strict checking.',
          '- Package manager: pnpm (required). Use pnpm, not npm, npx, Yarn or Bun package-manager commands, for installation, scaffolding, scripts, examples, documentation and CI. Pin a compatible pnpm version in package.json packageManager, commit pnpm-lock.yaml, and use pnpm install --frozen-lockfile in CI. Use pnpm add, pnpm exec and the pinned version’s supported pnpm scaffolding command. Preserve existing work; do not delete or replace another lockfile without explicit migration approval.',
          '- Package-manager reference: https://pnpm.io/installation',
        ]
      : []),
    ...(usesNext
      ? [
          '- UI library: React, through the Next.js App Router framework. React alone is not the full-stack framework.',
        ]
      : []),
    ...(usesTanstack
      ? [
          '- Application mode: Fullstack TanStack Start (React). Use TanStack Router/server routes/server functions, not Next.js App Router APIs. If a separate API layer is selected, define its boundary explicitly and avoid duplicate endpoints.',
        ]
      : []),
    ...choices
      .filter((choice) => !choice.omitted)
      .map(
        (choice) =>
          `- ${choice.responsibility}: ${choice.name}\n  Integration: ${choice.rationale}\n  Cost context: ${choice.cost}\n  Reference: ${choice.sourceUrl}`,
      ),
    '',
    '## Implementation brief',
    '1. Inspect the current repository and its instructions. Explain the architecture and verify the current official installation guides and package compatibility for the selected choices. Preserve existing work.',
    '2. Implement one useful vertical slice with a responsive, accessible interface, loading/empty/error states, and a clear README. Use only the selected provider for each responsibility. Do not silently substitute another stack.',
    '3. If authentication is selected, enforce authorization on the server. Implement sign-in, sign-out, session handling, and protected data access. Keep provider secrets server-side and document required environment variables.',
    '4. Document data models and migration commands. Do not provision paid services, deploy, or modify an existing database without explicit authorization. Use placeholders in .env.example and never invent API keys.',
    '5. Validate with the repository’s allowed checks and record their results. Document what remains dependent on account setup, credentials, or deployment.',
    '6. Do not add optional providers that were not selected. For external integrations, keep secrets server-side, verify webhook signatures, and make event handling idempotent. Hosted add-ons change the base stack’s self-hosting and cost assumptions.',
    ...(usesTanstack &&
    choices.some(
      (choice) =>
        choice.id === 'vercel' && choice.responsibility === 'Deployment',
    )
      ? [
          'Deployment compatibility: verify the current TanStack Start/Vercel adapter, runtime and build instructions for the pinned versions. Do not infer support or an experimental label from a screenshot. Reference: https://tanstack.com/start/latest/docs/framework/react/guide/hosting',
        ]
      : []),
    ...(choices.some(
      (choice) =>
        !choice.omitted &&
        choice.responsibility === 'Identity verification (KYC)',
    )
      ? [
          '7. Identity verification is separate from sign-in. Confirm the actual verification requirement before collecting sensitive data. Prefer the provider-hosted flow; never trust the browser redirect as approval. Verify the provider outcome on the server, store only necessary references/status, and never put identity documents or biometrics in logs or analytics. Confirm retention, consent, coverage, and review requirements with the product owner.',
        ]
      : []),
    '',
    '## Base stack tradeoffs (reassess when a choice is replaced)',
    ...stack.tradeoffs.map((tradeoff) => `- ${tradeoff}`),
    '- These selections customize the editorial stack. Recheck integration boundaries when replacing a component; hosted free tiers are not a promise of free production operation.',
    '',
    '## Stack references',
    `- https://howtobuild.dev/stacks/${stack.slug}`,
    ...stack.sources.map((source) => `- ${source.claim}: ${source.url}`),
  ].join('\n')
}
