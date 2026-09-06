import { createHash } from 'node:crypto'
import { ORPCError } from '@orpc/server'
import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import { getDb } from '../../db/client.server'
import {
  abuseReports,
  auditEvents,
  categories,
  editSuggestions,
  editorialRevisions,
  moderationEvents,
  projects,
  projectLinks,
  submissions,
  user,
} from '../../db/schema'
import type { EditorIdentity } from '../editorial/auth.server'
import type { EditSuggestionInput, SubmissionInput } from './model'
import { limitContribution } from './limits.server'
import { moderationTransitions } from './model'

type Contributor = { id: string; email: string; name: string }
const activeStates = [
  'submitted',
  'under_review',
  'changes_requested',
  'approved',
  'published',
]

export function parseGithubRepository(value: string) {
  const url = new URL(value)
  const match =
    /^\/([a-z0-9](?:[a-z0-9-]{0,38}))\/([a-z0-9_.-]{1,100})\/?$/i.exec(
      url.pathname,
    )
  if (
    url.protocol !== 'https:' ||
    url.hostname.toLowerCase() !== 'github.com' ||
    url.username ||
    url.password ||
    url.port ||
    url.search ||
    url.hash ||
    !match
  )
    throw new ORPCError('BAD_REQUEST', {
      message:
        'Use https://github.com/owner/repository, without subpages or query parameters.',
    })
  const owner = match[1].toLowerCase()
  const name = match[2].replace(/\.git$/i, '').toLowerCase()
  if (!name || name === '.' || name === '..') throw new ORPCError('BAD_REQUEST')
  return { owner, name, url: `https://github.com/${owner}/${name}` }
}

function fingerprint(value: unknown) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex')
}

async function guard(
  request: Request,
  contributor: Contributor,
  action: string,
  startedAt: number,
  max: number,
  ipMax: number,
) {
  await limitContribution(request, contributor.id, action, max, ipMax)
  const elapsed = Date.now() - startedAt
  if (elapsed < 2500 || elapsed > 86_400_000)
    throw new ORPCError('BAD_REQUEST', {
      message:
        'Please review the form and submit again. Reload if it has been open for over a day.',
    })
}

export async function createSubmission(
  input: SubmissionInput,
  contributor: Contributor,
  request: Request,
) {
  await guard(
    request,
    contributor,
    'project-submission',
    input.startedAt,
    3,
    10,
  )
  const coordinate = parseGithubRepository(input.repositoryUrl)
  // Timing/honeypot fields are transport controls, never part of the content fingerprint.
  const {
    startedAt: _startedAt,
    websiteField: _websiteField,
    ...fields
  } = input
  const payload = { ...fields, repositoryUrl: coordinate.url }
  return getDb().transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtextextended(${coordinate.url}, 0))`,
    )
    const existingProject = await tx.execute<{ id: string }>(sql`
      select p.id from projects p
      join project_links pl on pl.project_id = p.id and pl.kind = 'repository'
      where lower(regexp_replace(regexp_replace(pl.url, '/+$', ''), '\\.git$', '')) = ${coordinate.url}
      limit 1
    `)
    if (existingProject.rows.length)
      throw new ORPCError('CONFLICT', {
        message:
          'This project is already in the editorial catalog. Suggest an edit on its page instead.',
      })
    const duplicate = await tx.query.submissions.findFirst({
      where: and(
        eq(submissions.repositoryOwner, coordinate.owner),
        eq(submissions.repositoryName, coordinate.name),
        inArray(submissions.status, activeStates),
      ),
    })
    if (duplicate)
      throw new ORPCError('CONFLICT', {
        message: 'This repository already has an active submission.',
      })
    const category = await tx.query.categories.findFirst({
      where: eq(categories.id, input.categoryId),
    })
    if (!category)
      throw new ORPCError('BAD_REQUEST', {
        message: 'Select an existing category.',
      })
    const [created] = await tx
      .insert(submissions)
      .values({
        userId: contributor.id,
        repositoryUrl: coordinate.url,
        repositoryOwner: coordinate.owner,
        repositoryName: coordinate.name,
        fingerprint: fingerprint(payload),
        payload,
      })
      .returning({ id: submissions.id, status: submissions.status })
    await tx.insert(moderationEvents).values({
      actorId: contributor.id,
      submissionId: created.id,
      action: 'contribution.submitted',
      reason: 'Project submitted for editorial review.',
    })
    return created
  })
}

export async function createEditSuggestion(
  input: EditSuggestionInput,
  contributor: Contributor,
  request: Request,
) {
  await guard(request, contributor, 'edit-suggestion', input.startedAt, 10, 30)
  const {
    startedAt: _startedAt,
    websiteField: _websiteField,
    ...payload
  } = input
  const hash = fingerprint(payload)
  return getDb().transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtextextended(${hash}, 0))`,
    )
    const project = await tx.query.projects.findFirst({
      where: and(
        eq(projects.id, input.projectId),
        eq(projects.status, 'published'),
      ),
    })
    if (!project) throw new ORPCError('NOT_FOUND')
    const duplicate = await tx.query.editSuggestions.findFirst({
      where: and(
        eq(editSuggestions.projectId, input.projectId),
        eq(editSuggestions.fingerprint, hash),
        inArray(editSuggestions.status, activeStates),
      ),
    })
    if (duplicate)
      throw new ORPCError('CONFLICT', {
        message: 'This change is already awaiting review.',
      })
    const [created] = await tx
      .insert(editSuggestions)
      .values({
        userId: contributor.id,
        projectId: input.projectId,
        fingerprint: hash,
        payload,
      })
      .returning({ id: editSuggestions.id, status: editSuggestions.status })
    await tx.insert(moderationEvents).values({
      actorId: contributor.id,
      editSuggestionId: created.id,
      action: 'contribution.submitted',
      reason: 'Correction submitted for editorial review.',
    })
    return created
  })
}

export async function listContributorActivity(userId: string) {
  const db = getDb()
  const [submissionRows, suggestionRows] = await Promise.all([
    db
      .select()
      .from(submissions)
      .where(eq(submissions.userId, userId))
      .orderBy(desc(submissions.createdAt)),
    db
      .select({
        suggestion: editSuggestions,
        projectName: projects.name,
        projectSlug: projects.slug,
      })
      .from(editSuggestions)
      .innerJoin(projects, eq(editSuggestions.projectId, projects.id))
      .where(eq(editSuggestions.userId, userId))
      .orderBy(desc(editSuggestions.createdAt)),
  ])
  // Only events attached to this account's contributions are visible to the contributor.
  const events = await db
    .select()
    .from(moderationEvents)
    .where(
      sql`
    ${moderationEvents.submissionId} in (select id from submissions where user_id = ${userId})
    or ${moderationEvents.editSuggestionId} in (select id from edit_suggestions where user_id = ${userId})
  `,
    )
    .orderBy(desc(moderationEvents.createdAt))
  return { submissions: submissionRows, suggestions: suggestionRows, events }
}

export async function listModerationQueue() {
  const db = getDb()
  const [submissionRows, suggestionRows, reports, events] = await Promise.all([
    db
      .select({
        submission: submissions,
        submitterName: user.name,
        submitterEmail: user.email,
        categoryName: categories.name,
      })
      .from(submissions)
      .innerJoin(user, eq(submissions.userId, user.id))
      .leftJoin(
        categories,
        sql`${categories.id}::text = ${submissions.payload}->>'categoryId'`,
      )
      .orderBy(desc(submissions.createdAt)),
    db
      .select({
        suggestion: editSuggestions,
        submitterName: user.name,
        projectName: projects.name,
        projectSlug: projects.slug,
      })
      .from(editSuggestions)
      .innerJoin(user, eq(editSuggestions.userId, user.id))
      .innerJoin(projects, eq(editSuggestions.projectId, projects.id))
      .orderBy(desc(editSuggestions.createdAt)),
    db.select().from(abuseReports).orderBy(desc(abuseReports.createdAt)),
    db
      .select()
      .from(moderationEvents)
      .orderBy(desc(moderationEvents.createdAt)),
  ])
  return {
    submissions: submissionRows,
    suggestions: suggestionRows,
    reports,
    events,
  }
}

export async function moderateContribution(
  input: {
    kind: 'submission' | 'suggestion'
    id: string
    status: string
    reason: string
  },
  actor: EditorIdentity,
) {
  const table = input.kind === 'submission' ? submissions : editSuggestions
  return getDb().transaction(async (tx) => {
    const current = (
      await tx.select().from(table).where(eq(table.id, input.id)).for('update')
    ).at(0)
    if (!current) throw new ORPCError('NOT_FOUND')
    if (
      !moderationTransitions[current.status]?.some(
        (status) => status === input.status,
      )
    )
      throw new ORPCError('CONFLICT', {
        message: 'That state change is not available. Refresh the queue.',
      })
    const [updated] = await tx
      .update(table)
      .set({
        status: input.status,
        moderationReason: input.reason,
        updatedAt: new Date(),
      })
      .where(eq(table.id, input.id))
      .returning({ id: table.id, status: table.status })
    await tx.insert(moderationEvents).values({
      actorId: actor.id,
      submissionId: input.kind === 'submission' ? input.id : null,
      editSuggestionId: input.kind === 'suggestion' ? input.id : null,
      action: `moderation.${input.status}`,
      reason: input.reason,
    })
    return updated
  })
}

export async function respondToReview(
  input: { kind: 'submission' | 'suggestion'; id: string; message: string },
  contributor: Contributor,
  request: Request,
) {
  await limitContribution(request, contributor.id, 'review-response', 10, 30)
  const table = input.kind === 'submission' ? submissions : editSuggestions
  return getDb().transaction(async (tx) => {
    const current = (
      await tx
        .select()
        .from(table)
        .where(and(eq(table.id, input.id), eq(table.userId, contributor.id)))
        .for('update')
    ).at(0)
    if (!current) throw new ORPCError('NOT_FOUND')
    if (current.status !== 'changes_requested')
      throw new ORPCError('CONFLICT', {
        message: 'Responses are available when an editor requests changes.',
      })
    await tx.insert(moderationEvents).values({
      actorId: contributor.id,
      submissionId: input.kind === 'submission' ? input.id : null,
      editSuggestionId: input.kind === 'suggestion' ? input.id : null,
      action: 'contribution.responded',
      reason: input.message,
    })
    await tx
      .update(table)
      .set({ status: 'submitted', updatedAt: new Date() })
      .where(eq(table.id, input.id))
    return { accepted: true }
  })
}

export async function prepareSubmissionDraft(
  id: string,
  actor: EditorIdentity,
) {
  return getDb().transaction(async (tx) => {
    const submission = (
      await tx
        .select()
        .from(submissions)
        .where(eq(submissions.id, id))
        .for('update')
    ).at(0)
    if (!submission) throw new ORPCError('NOT_FOUND')
    if (submission.status !== 'approved')
      throw new ORPCError('CONFLICT', {
        message: 'Approve this submission before preparing an editorial draft.',
      })
    if (submission.projectId) {
      const project = await tx.query.projects.findFirst({
        where: eq(projects.id, submission.projectId),
      })
      if (!project) throw new ORPCError('NOT_FOUND')
      return { slug: project.slug }
    }
    const payload = submission.payload
    const name = String(payload.name)
    const slugBase =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 60) || 'project'
    const [project] = await tx
      .insert(projects)
      .values({
        slug: `${slugBase}-${submission.id.slice(0, 8)}`,
        name,
        shortDescription: String(payload.shortExplanation).slice(0, 180),
        editorialDescription: String(payload.shortExplanation),
        whyInteresting: String(payload.whyInteresting),
        bestFor: [],
        notIdealFor: [],
        projectType: String(payload.projectType),
        categoryId: String(payload.categoryId),
        status: 'draft',
        pricingLabel: 'Unknown',
        pricingSummary: String(payload.pricingInformation),
        openSource: false,
        selfHostable: false,
        createdBy: actor.id,
        updatedBy: actor.id,
      })
      .returning()
    const links = [{ kind: 'repository', url: submission.repositoryUrl }]
    for (const key of ['website', 'documentation'] as const)
      if (typeof payload[key] === 'string' && payload[key])
        links.push({ kind: key, url: payload[key] })
    await tx
      .insert(projectLinks)
      .values(links.map((link) => ({ ...link, projectId: project.id })))
    const snapshot = { ...project, links, communitySubmissionId: id }
    await tx.insert(editorialRevisions).values({
      projectId: project.id,
      revision: 1,
      snapshot,
      actorId: actor.id,
      reason:
        'Prepared a draft from an approved community submission; factual verification required.',
    })
    await tx.insert(auditEvents).values({
      actorId: actor.id,
      projectId: project.id,
      action: 'submission.draft_prepared',
      reason: 'Editorial draft created for independent source review.',
      after: snapshot,
    })
    await tx
      .update(submissions)
      .set({ projectId: project.id, updatedAt: new Date() })
      .where(eq(submissions.id, id))
    await tx.insert(moderationEvents).values({
      actorId: actor.id,
      submissionId: id,
      action: 'moderation.draft_prepared',
      reason:
        'An editor prepared a draft. Publication follows independent verification.',
    })
    return { slug: project.slug }
  })
}

export async function completeSuggestion(
  id: string,
  reason: string,
  actor: EditorIdentity,
) {
  return getDb().transaction(async (tx) => {
    const suggestion = (
      await tx
        .select()
        .from(editSuggestions)
        .where(eq(editSuggestions.id, id))
        .for('update')
    ).at(0)
    if (!suggestion) throw new ORPCError('NOT_FOUND')
    if (suggestion.status !== 'approved')
      throw new ORPCError('CONFLICT', {
        message: 'Approve the suggestion first.',
      })
    const project = await tx.query.projects.findFirst({
      where: and(
        eq(projects.id, suggestion.projectId),
        eq(projects.status, 'published'),
      ),
    })
    const revision = await tx.query.editorialRevisions.findFirst({
      where: and(
        eq(editorialRevisions.projectId, suggestion.projectId),
        sql`${editorialRevisions.createdAt} > ${suggestion.updatedAt}`,
      ),
      orderBy: desc(editorialRevisions.revision),
    })
    if (!project || !revision)
      throw new ORPCError('CONFLICT', {
        message:
          'Save the verified correction on the published project before marking it applied.',
      })
    await tx
      .update(editSuggestions)
      .set({
        status: 'published',
        moderationReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(editSuggestions.id, id))
    await tx.insert(moderationEvents).values({
      actorId: actor.id,
      editSuggestionId: id,
      action: 'moderation.published',
      reason: `${reason} (Project revision ${revision.revision})`,
    })
    await tx.insert(auditEvents).values({
      actorId: actor.id,
      projectId: project.id,
      action: 'suggestion.applied',
      reason,
      after: { suggestionId: id, revisionId: revision.id },
    })
    return { applied: true }
  })
}

export async function createAbuseReport(
  input: {
    projectId?: string
    pageUrl: string
    reason: string
    details: string
  },
  contributor: Contributor,
  request: Request,
) {
  await limitContribution(request, contributor.id, 'abuse-report', 5, 15)
  if (input.projectId) {
    const project = await getDb().query.projects.findFirst({
      where: and(
        eq(projects.id, input.projectId),
        eq(projects.status, 'published'),
      ),
    })
    if (!project) throw new ORPCError('NOT_FOUND')
  }
  const [created] = await getDb()
    .insert(abuseReports)
    .values({ ...input, reporterId: contributor.id })
    .returning({ id: abuseReports.id })
  return created
}

export async function resolveAbuseReport(
  id: string,
  reason: string,
  actor: EditorIdentity,
) {
  return getDb().transaction(async (tx) => {
    const report = (
      await tx
        .update(abuseReports)
        .set({ status: 'resolved' })
        .where(and(eq(abuseReports.id, id), eq(abuseReports.status, 'open')))
        .returning()
    ).at(0)
    if (!report) throw new ORPCError('CONFLICT')
    await tx.insert(auditEvents).values({
      actorId: actor.id,
      projectId: report.projectId,
      action: 'abuse.resolved',
      reason,
      after: { reportId: id },
    })
    return { resolved: true }
  })
}
