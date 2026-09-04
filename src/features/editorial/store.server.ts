import { and, asc, desc, eq, max } from 'drizzle-orm'

import { getDb } from '../../db/client.server'
import {
  auditEvents,
  categories,
  editorialRevisions,
  projectLinks,
  projectRedirects,
  projects,
  projectSources,
} from '../../db/schema'
import type { EditorIdentity } from './auth.server'
import { validatePublishable } from './model'
import type { ProjectDraft, PublicProject } from './model'

type Db = ReturnType<typeof getDb>

function iso(date: Date | null) {
  return date?.toISOString() ?? null
}

async function hydrateProject(
  db: Db,
  project: typeof projects.$inferSelect,
): Promise<PublicProject> {
  const [category, links, sources] = await Promise.all([
    db.query.categories.findFirst({
      where: eq(categories.id, project.categoryId),
    }),
    db
      .select({ kind: projectLinks.kind, url: projectLinks.url })
      .from(projectLinks)
      .where(eq(projectLinks.projectId, project.id)),
    db
      .select({
        claim: projectSources.claim,
        sourceType: projectSources.sourceType,
        url: projectSources.url,
        checkedAt: projectSources.checkedAt,
        checkedBy: projectSources.checkedBy,
      })
      .from(projectSources)
      .where(eq(projectSources.projectId, project.id)),
  ])
  if (!category) throw new Error('Project category is missing')
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
    links,
    sources: sources.map((source) => ({
      ...source,
      checkedAt: source.checkedAt.toISOString(),
    })),
  }
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
  return Promise.all(rows.map(({ project }) => hydrateProject(db, project)))
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
  return Promise.all(rows.map((project) => hydrateProject(db, project)))
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
