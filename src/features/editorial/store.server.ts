import { and, asc, desc, eq, inArray, max } from 'drizzle-orm'

import { getDb } from '../../db/client.server'
import {
  auditEvents,
  categories,
  editorialRevisions,
  facets,
  projectFacets,
  projectLinks,
  projectMomentum,
  projectRepositories,
  projectRedirects,
  projects,
  projectSources,
  repositories,
  stackItems,
  stacks,
  submissions,
  moderationEvents,
} from '../../db/schema'
import type { EditorIdentity } from './auth.server'
import { metricHealth, validatePublishable } from './model'
import type { ProjectDraft, PublicProject } from './model'

type Db = ReturnType<typeof getDb>

function iso(date: Date | null) {
  return date?.toISOString() ?? null
}

async function hydrateProjects(
  db: Db,
  projectRows: Array<typeof projects.$inferSelect>,
): Promise<PublicProject[]> {
  if (!projectRows.length) return []
  const projectIds = projectRows.map((project) => project.id)
  const categoryIds = [
    ...new Set(projectRows.map((project) => project.categoryId)),
  ]
  const [
    categoryRows,
    links,
    sources,
    assignedFacets,
    momentumRows,
    stackRows,
  ] = await Promise.all([
    db.select().from(categories).where(inArray(categories.id, categoryIds)),
    db
      .select({
        projectId: projectLinks.projectId,
        kind: projectLinks.kind,
        url: projectLinks.url,
      })
      .from(projectLinks)
      .where(inArray(projectLinks.projectId, projectIds)),
    db
      .select({
        projectId: projectSources.projectId,
        claim: projectSources.claim,
        sourceType: projectSources.sourceType,
        url: projectSources.url,
        checkedAt: projectSources.checkedAt,
        checkedBy: projectSources.checkedBy,
      })
      .from(projectSources)
      .where(inArray(projectSources.projectId, projectIds)),
    db
      .select({
        projectId: projectFacets.projectId,
        id: facets.id,
        kind: facets.kind,
        slug: facets.slug,
        name: facets.name,
      })
      .from(projectFacets)
      .innerJoin(facets, eq(projectFacets.facetId, facets.id))
      .where(inArray(projectFacets.projectId, projectIds))
      .orderBy(asc(facets.kind), asc(facets.name)),
    db
      .select({
        projectId: projectMomentum.projectId,
        momentum: projectMomentum,
        repository: repositories,
      })
      .from(projectMomentum)
      .innerJoin(
        projectRepositories,
        eq(projectMomentum.projectId, projectRepositories.projectId),
      )
      .innerJoin(
        repositories,
        eq(projectRepositories.repositoryId, repositories.id),
      )
      .where(
        and(
          inArray(projectMomentum.projectId, projectIds),
          eq(projectRepositories.isDefault, true),
        ),
      )
      .orderBy(desc(projectMomentum.calculatedAt)),
    db
      .select({
        projectId: stackItems.projectId,
        slug: stacks.slug,
        name: stacks.name,
        responsibility: stackItems.responsibility,
      })
      .from(stackItems)
      .innerJoin(stacks, eq(stackItems.stackId, stacks.id))
      .where(
        and(
          inArray(stackItems.projectId, projectIds),
          eq(stacks.status, 'published'),
        ),
      )
      .orderBy(asc(stacks.name)),
  ])
  const categoryById = new Map(
    categoryRows.map((category) => [category.id, category]),
  )
  const latestMomentum = new Map<string, (typeof momentumRows)[number]>()
  for (const row of momentumRows)
    if (!latestMomentum.has(row.projectId))
      latestMomentum.set(row.projectId, row)

  return projectRows.map((project) => {
    const category = categoryById.get(project.categoryId)
    if (!category) throw new Error('Project category is missing')
    const metric = latestMomentum.get(project.id)
    return {
      ...project,
      bestFor: project.bestFor,
      notIdealFor: project.notIdealFor,
      publishedAt: iso(project.publishedAt),
      updatedAt: project.updatedAt.toISOString(),
      category: {
        id: category.id,
        slug: category.slug,
        name: category.name,
        accent: category.accent,
      },
      links: links
        .filter((link) => link.projectId === project.id)
        .map(({ kind, url }) => ({ kind, url })),
      facets: assignedFacets
        .filter((facet) => facet.projectId === project.id)
        .map(({ id, kind, slug, name }) => ({ id, kind, slug, name })),
      momentum: metric
        ? {
            stars: metric.momentum.stars,
            absolute7d: metric.momentum.absolute7d,
            absolute30d: metric.momentum.absolute30d,
            absolute49d: metric.momentum.absolute49d,
            relative49d: metric.momentum.relative49d,
            weeklyWindowStart: iso(metric.momentum.weeklyWindowStart),
            monthlyWindowStart: iso(metric.momentum.monthlyWindowStart),
            sevenWeekWindowStart: iso(metric.momentum.sevenWeekWindowStart),
            relative7d: metric.momentum.relative7d,
            relative30d: metric.momentum.relative30d,
            score: metric.momentum.score,
            confidence: metric.momentum.confidence as
              'early' | 'weekly' | 'complete',
            windowStart: iso(metric.momentum.windowStart),
            windowEnd: metric.momentum.windowEnd.toISOString(),
            anomaly: metric.momentum.anomaly,
            algorithmVersion: metric.momentum.algorithmVersion,
            health: metricHealth(metric.repository),
          }
        : null,
      stacks: stackRows
        .filter((stack) => stack.projectId === project.id)
        .map(({ projectId: _projectId, ...stack }) => stack),
      sources: sources
        .filter((source) => source.projectId === project.id)
        .map(({ projectId: _projectId, ...source }) => ({
          ...source,
          checkedAt: source.checkedAt.toISOString(),
        })),
    }
  })
}

async function hydrateProject(db: Db, project: typeof projects.$inferSelect) {
  const hydrated = (await hydrateProjects(db, [project])).at(0)
  if (!hydrated) throw new Error('Project could not be hydrated')
  return hydrated
}

export async function listCategories() {
  return getDb().select().from(categories).orderBy(asc(categories.sortOrder))
}

export async function listPublishedProjects(categorySlug?: string) {
  const db = getDb()
  const rows = await db
    .select({ project: projects })
    .from(projects)
    .innerJoin(categories, eq(projects.categoryId, categories.id))
    .where(
      categorySlug
        ? and(
            eq(projects.status, 'published'),
            eq(categories.slug, categorySlug),
          )
        : eq(projects.status, 'published'),
    )
    .orderBy(desc(projects.recommended), asc(projects.name))
  return hydrateProjects(
    db,
    rows.map(({ project }) => project),
  )
}

export async function findProjectBySlug(slug: string, includeDraft = false) {
  const db = getDb()
  const project = await db.query.projects.findFirst({
    where: includeDraft
      ? eq(projects.slug, slug)
      : and(eq(projects.slug, slug), eq(projects.status, 'published')),
  })
  return project ? hydrateProject(db, project) : null
}

export async function findRedirect(slug: string) {
  const row = await getDb()
    .select({ slug: projects.slug })
    .from(projectRedirects)
    .innerJoin(projects, eq(projectRedirects.projectId, projects.id))
    .where(eq(projectRedirects.oldSlug, slug))
    .limit(1)
  return row[0]?.slug ?? null
}

export async function listEditorProjects() {
  const db = getDb()
  const rows = await db
    .select()
    .from(projects)
    .orderBy(desc(projects.updatedAt))
  return hydrateProjects(db, rows)
}

async function revisionNumber(
  tx: Parameters<Parameters<Db['transaction']>[0]>[0],
  projectId: string,
) {
  const [row] = await tx
    .select({ value: max(editorialRevisions.revision) })
    .from(editorialRevisions)
    .where(eq(editorialRevisions.projectId, projectId))
  return (row.value ?? 0) + 1
}

function snapshot(project: typeof projects.$inferSelect) {
  return {
    slug: project.slug,
    name: project.name,
    shortDescription: project.shortDescription,
    editorialDescription: project.editorialDescription,
    whyInteresting: project.whyInteresting,
    bestFor: project.bestFor,
    notIdealFor: project.notIdealFor,
    projectType: project.projectType,
    categoryId: project.categoryId,
    status: project.status,
    openSource: project.openSource,
    license: project.license,
    selfHostable: project.selfHostable,
    pricingLabel: project.pricingLabel,
    pricingSummary: project.pricingSummary,
    recommended: project.recommended,
    worthWatching: project.worthWatching,
  }
}

export async function saveDraft(input: ProjectDraft, actor: EditorIdentity) {
  const db = getDb()
  return db.transaction(async (tx) => {
    const previous = input.id
      ? await tx.query.projects.findFirst({ where: eq(projects.id, input.id) })
      : undefined
    const values = {
      slug: input.slug,
      name: input.name,
      shortDescription: input.shortDescription,
      editorialDescription: input.editorialDescription,
      whyInteresting: input.whyInteresting,
      bestFor: input.bestFor,
      notIdealFor: input.notIdealFor,
      projectType: input.projectType,
      categoryId: input.categoryId,
      openSource: input.openSource,
      license: input.license,
      selfHostable: input.selfHostable,
      pricingLabel: input.pricingLabel,
      pricingSummary: input.pricingSummary,
      recommended: input.recommended,
      worthWatching: input.worthWatching,
      updatedBy: actor.id,
      updatedAt: new Date(),
    }
    let project: typeof projects.$inferSelect
    if (previous) {
      if (previous.slug !== input.slug) {
        await tx
          .insert(projectRedirects)
          .values({ oldSlug: previous.slug, projectId: previous.id })
          .onConflictDoNothing()
      }
      const [updated] = await tx
        .update(projects)
        .set(values)
        .where(eq(projects.id, previous.id))
        .returning()
      project = updated
    } else {
      const [created] = await tx
        .insert(projects)
        .values({ ...values, createdBy: actor.id, status: 'draft' })
        .returning()
      project = created
    }

    await tx.delete(projectLinks).where(eq(projectLinks.projectId, project.id))
    await tx
      .insert(projectLinks)
      .values(input.links.map((link) => ({ ...link, projectId: project.id })))
    await tx
      .delete(projectSources)
      .where(eq(projectSources.projectId, project.id))
    await tx.insert(projectSources).values(
      input.sources.map((source) => ({
        ...source,
        projectId: project.id,
        checkedAt: new Date(),
        checkedBy: actor.name,
      })),
    )
    const revision = await revisionNumber(tx, project.id)
    await tx.insert(editorialRevisions).values({
      projectId: project.id,
      revision,
      snapshot: snapshot(project),
      reason: input.reason,
      actorId: actor.id,
    })
    await tx.insert(auditEvents).values({
      actorId: actor.id,
      projectId: project.id,
      action: previous ? 'project.updated' : 'project.created',
      reason: input.reason,
      before: previous ? snapshot(previous) : null,
      after: snapshot(project),
    })
    return { id: project.id, slug: project.slug, revision }
  })
}

export async function setPublication(
  projectId: string,
  publish: boolean,
  reason: string,
  actor: EditorIdentity,
) {
  const db = getDb()
  return db.transaction(async (tx) => {
    const project = await tx.query.projects.findFirst({
      where: eq(projects.id, projectId),
    })
    if (!project) throw new Error('NOT_FOUND')
    const [links, sources] = await Promise.all([
      tx
        .select()
        .from(projectLinks)
        .where(eq(projectLinks.projectId, projectId)),
      tx
        .select()
        .from(projectSources)
        .where(eq(projectSources.projectId, projectId)),
    ])
    if (publish) {
      const missing = validatePublishable({
        ...project,
        links: links.map(({ kind, url }) => ({
          kind: kind as ProjectDraft['links'][number]['kind'],
          url,
        })),
        sources: sources.map(({ claim, sourceType, url }) => ({
          claim,
          sourceType:
            sourceType as ProjectDraft['sources'][number]['sourceType'],
          url,
        })),
      })
      if (missing.length)
        throw new Error(`Project is not publishable: ${missing.join(', ')}`)
    }
    const nextStatus = publish ? 'published' : 'draft'
    const linkedSubmissions = await tx
      .select()
      .from(submissions)
      .where(eq(submissions.projectId, projectId))
      .for('update')
    if (
      publish &&
      linkedSubmissions.some(
        (item) => !['approved', 'published'].includes(item.status),
      )
    ) {
      throw new Error(
        'The linked community submission must be approved before publication.',
      )
    }
    const [updated] = await tx
      .update(projects)
      .set({
        status: nextStatus,
        publishedAt: publish ? (project.publishedAt ?? new Date()) : null,
        reviewedAt: new Date(),
        updatedAt: new Date(),
        updatedBy: actor.id,
      })
      .where(eq(projects.id, projectId))
      .returning()
    const revision = await revisionNumber(tx, projectId)
    await tx.insert(editorialRevisions).values({
      projectId,
      revision,
      snapshot: snapshot(updated),
      reason,
      actorId: actor.id,
    })
    await tx.insert(auditEvents).values({
      actorId: actor.id,
      projectId,
      action: publish ? 'project.published' : 'project.unpublished',
      reason,
      before: snapshot(project),
      after: snapshot(updated),
    })
    for (const item of linkedSubmissions) {
      await tx
        .update(submissions)
        .set({
          status: publish ? 'published' : 'approved',
          moderationReason: reason,
          updatedAt: new Date(),
        })
        .where(eq(submissions.id, item.id))
      await tx.insert(moderationEvents).values({
        actorId: actor.id,
        submissionId: item.id,
        action: publish ? 'moderation.published' : 'moderation.unpublished',
        reason,
      })
    }
    return { id: projectId, status: nextStatus, revision }
  })
}

export async function getProjectHistory(projectId: string) {
  const db = getDb()
  const [revisions, audit] = await Promise.all([
    db
      .select({
        id: editorialRevisions.id,
        revision: editorialRevisions.revision,
        reason: editorialRevisions.reason,
        actorId: editorialRevisions.actorId,
        createdAt: editorialRevisions.createdAt,
      })
      .from(editorialRevisions)
      .where(eq(editorialRevisions.projectId, projectId))
      .orderBy(desc(editorialRevisions.revision)),
    db
      .select({
        id: auditEvents.id,
        action: auditEvents.action,
        reason: auditEvents.reason,
        actorId: auditEvents.actorId,
        createdAt: auditEvents.createdAt,
      })
      .from(auditEvents)
      .where(eq(auditEvents.projectId, projectId))
      .orderBy(desc(auditEvents.createdAt)),
  ])
  return {
    revisions: revisions.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
    })),
    audit: audit.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
    })),
  }
}
