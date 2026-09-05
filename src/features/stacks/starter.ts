import type { PublicStack } from '../editorial/model'

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
  const chosenProjects = new Set(
    base.map(
      (group) =>
        group.options.find(
          (option) => option.id === selections[group.responsibility],
        )?.id ?? group.options[0].id,
    ),
  )
  for (const option of stack.starterOptions) {
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
  return base
}

export function buildStarterPrompt(
  stack: PublicStack,
  choices: StarterChoice[],
  purpose: string,
) {
  const usesNext = choices.some((choice) => choice.id === 'nextjs')
  return [
    `# Build with ${stack.name}`,
    '',
    `Product brief: ${purpose.trim() || stack.summary}`,
    `Target user: ${stack.targetUser}`,
    '',
    '## Selected technologies',
    ...(usesNext
      ? [
          '- Language: TypeScript with strict checking.',
          '- UI library: React, through the Next.js App Router framework. React alone is not the full-stack framework.',
        ]
      : []),
    ...choices.map(
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
