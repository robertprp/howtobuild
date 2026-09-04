import { and, asc, eq, inArray } from 'drizzle-orm'

import { getDb } from '../../db/client.server'
import {
  categories,
  projects,
  stackAlternatives,
  stackItems,
  stackSources,
  stacks,
} from '../../db/schema'
import type { PublicStack, PublicStackProject } from '../editorial/model'

function projectShape(row: {
  project: typeof projects.$inferSelect
  category: typeof categories.$inferSelect
}): PublicStackProject {
  return {
    id: row.project.id,
    slug: row.project.slug,
    name: row.project.name,
    shortDescription: row.project.shortDescription,
    openSource: row.project.openSource,
    selfHostable: row.project.selfHostable,
    pricingLabel: row.project.pricingLabel,
    category: {
      id: row.category.id,
      slug: row.category.slug,
      name: row.category.name,
      accent: row.category.accent,
    },
  }
}

async function hydrateStacks(rows: Array<typeof stacks.$inferSelect>) {
  if (!rows.length) return []
  const db = getDb()
  const stackIds = rows.map((stack) => stack.id)
  const [items, sources] = await Promise.all([
    db
      .select({
        stackItem: stackItems,
        project: projects,
        category: categories,
      })
      .from(stackItems)
      .innerJoin(projects, eq(stackItems.projectId, projects.id))
      .innerJoin(categories, eq(projects.categoryId, categories.id))
      .where(
        and(
          inArray(stackItems.stackId, stackIds),
          eq(projects.status, 'published'),
        ),
      )
      .orderBy(asc(stackItems.sortOrder)),
    db
      .select()
      .from(stackSources)
      .where(inArray(stackSources.stackId, stackIds))
      .orderBy(asc(stackSources.checkedAt)),
  ])
  const itemIds = items.map(({ stackItem }) => stackItem.id)
  const alternatives = itemIds.length
    ? await db
        .select({
          alternative: stackAlternatives,
          project: projects,
          category: categories,
        })
        .from(stackAlternatives)
        .innerJoin(projects, eq(stackAlternatives.projectId, projects.id))
        .innerJoin(categories, eq(projects.categoryId, categories.id))
        .where(
          and(
            inArray(stackAlternatives.stackItemId, itemIds),
            eq(projects.status, 'published'),
          ),
        )
        .orderBy(asc(projects.name))
    : []

  return rows.map((stack): PublicStack => ({
    id: stack.id,
    slug: stack.slug,
    name: stack.name,
    summary: stack.summary,
    description: stack.description,
    targetUser: stack.targetUser,
    earlyStageFit: stack.earlyStageFit,
    openSourceSummary: stack.openSourceSummary,
    costSummary: stack.costSummary,
    tradeoffs: stack.tradeoffs,
    publishedAt: stack.publishedAt?.toISOString() ?? null,
    updatedAt: stack.updatedAt.toISOString(),
    items: items
      .filter(({ stackItem }) => stackItem.stackId === stack.id)
      .map(({ stackItem, project, category }) => ({
        id: stackItem.id,
        responsibility: stackItem.responsibility,
        rationale: stackItem.rationale,
        sortOrder: stackItem.sortOrder,
        project: projectShape({ project, category }),
        alternatives: alternatives
          .filter(({ alternative }) => alternative.stackItemId === stackItem.id)
          .map(
            ({
              alternative,
              project: alternativeProject,
              category: alternativeCategory,
            }) => ({
              rationale: alternative.rationale,
              project: projectShape({
                project: alternativeProject,
                category: alternativeCategory,
              }),
            }),
          ),
      })),
    sources: sources
      .filter((source) => source.stackId === stack.id)
      .map((source) => ({
        claim: source.claim,
        url: source.url,
        checkedAt: source.checkedAt.toISOString(),
        checkedBy: source.checkedBy,
      })),
  }))
}

export async function listPublishedStacks() {
  const rows = await getDb()
    .select()
    .from(stacks)
    .where(eq(stacks.status, 'published'))
    .orderBy(asc(stacks.name))
  return hydrateStacks(rows)
}

export async function findPublishedStack(slug: string) {
  const row = await getDb().query.stacks.findFirst({
    where: and(eq(stacks.slug, slug), eq(stacks.status, 'published')),
  })
  return row ? (await hydrateStacks([row]))[0] : null
}
