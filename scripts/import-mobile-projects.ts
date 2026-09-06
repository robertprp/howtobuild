import { eq as equals } from 'drizzle-orm'
import { getDb, getPool } from '../src/db/client.server'
import {
  categories,
  facets,
  projectFacets,
  projectLinks,
  projectRepositories,
  projectSources,
  projects,
} from '../src/db/schema'
import { collectGitHubRepository } from '../src/features/github/collector'
import { calculateAndStoreMomentum } from '../src/features/github/momentum.server'
import { postgresSnapshotStore } from '../src/features/github/store.server'
import { mobileProjects } from './data/mobile-projects'

// Explicit data import into an EXISTING database; never creates schema/services.
const apply = process.argv.includes('--apply')
if (process.argv.slice(2).some((arg) => arg !== '--apply'))
  throw new Error('Usage: import-mobile-projects.ts [--apply]')
if (!apply) {
  console.log(
    JSON.stringify({ dryRun: true, projects: mobileProjects }, null, 2),
  )
} else {
  if (!process.env.DATABASE_URL || !process.env.GITHUB_TOKEN)
    throw new Error('DATABASE_URL and GITHUB_TOKEN are required')
  const db = getDb()
  try {
    const category = await db.query.categories.findFirst({
      where: equals(categories.slug, 'mobile'),
    })
    if (!category)
      throw new Error(
        'Existing mobile category required; apply the catalog migrations separately.',
      )
    for (const entry of mobileProjects) {
      // Fetch before publishing. Network errors leave this entry unpublished.
      await collectGitHubRepository(
        entry.repo,
        process.env.GITHUB_TOKEN,
        postgresSnapshotStore,
      )
      const [owner, name] = entry.repo.split('/')
      const repository = await db.query.repositories.findFirst({
        where: (table, { and, eq }) =>
          and(eq(table.owner, owner), eq(table.name, name)),
      })
      if (
        !repository ||
        repository.archived ||
        repository.private ||
        repository.manuallyExcluded
      )
        throw new Error(`Repository unavailable: ${entry.repo}`)
      const result = await db.transaction(async (tx) => {
        const inserted = await tx
          .insert(projects)
          .values({
            slug: entry.slug,
            name: entry.name,
            shortDescription: entry.summary,
            editorialDescription: `${entry.summary} ${entry.fit}. ${entry.caution}`,
            whyInteresting: `Adds a focused ${entry.feature.toLowerCase()} option to the mobile catalog. Evaluate it against the application's actual requirements rather than its total GitHub stars.`,
            bestFor: [entry.fit],
            notIdealFor: [entry.caution],
            projectType:
              entry.slug === 'nativescript'
                ? 'Framework'
                : entry.slug === 'maestro'
                  ? 'Tool'
                  : 'Library',
            categoryId: category.id,
            status: 'published',
            openSource: true,
            license: entry.license,
            selfHostable: false,
            pricingLabel: 'Free',
            pricingSummary:
              'Open-source core. Build infrastructure, distribution, and optional hosted or commercial products may cost extra.',
            reviewedAt: new Date('2026-09-06T00:00:00Z'),
            publishedAt: new Date(),
          })
          .onConflictDoNothing({ target: projects.slug })
          .returning()
        // Never overwrite an editor's existing entry, draft, links, or review.
        const project = inserted.at(0)
        if (!project) return 'already exists'
        const repoUrl = `https://github.com/${entry.repo}`
        await tx.insert(projectLinks).values([
          { projectId: project.id, kind: 'website', url: entry.website },
          { projectId: project.id, kind: 'repository', url: repoUrl },
        ])
        await tx.insert(projectSources).values([
          {
            projectId: project.id,
            claim: 'Capabilities and integration constraints',
            sourceType: 'maintainer',
            url: entry.website,
            checkedAt: new Date('2026-09-06T00:00:00Z'),
            checkedBy: 'Catalog research import (2026-09-06)',
          },
          {
            projectId: project.id,
            claim: 'Repository identity, license, and development activity',
            sourceType: 'maintainer',
            url: repoUrl,
            checkedAt: new Date(),
            checkedBy: 'Catalog research import (2026-09-06)',
          },
        ])
        await tx.insert(projectRepositories).values({
          projectId: project.id,
          repositoryId: repository.id,
          isDefault: true,
        })
        for (const item of [
          {
            kind: 'ecosystem',
            slug: entry.feature.toLowerCase().replaceAll(' ', '-'),
            name: entry.feature,
          },
          {
            kind: 'language',
            slug: entry.language,
            name:
              entry.language === 'dart'
                ? 'Dart'
                : entry.language === 'kotlin'
                  ? 'Kotlin'
                  : 'TypeScript',
          },
        ]) {
          await tx.insert(facets).values(item).onConflictDoNothing()
          const facet = await tx.query.facets.findFirst({
            where: (table, { and, eq }) =>
              and(eq(table.kind, item.kind), eq(table.slug, item.slug)),
          })
          if (!facet) throw new Error('Facet could not be resolved')
          await tx
            .insert(projectFacets)
            .values({ projectId: project.id, facetId: facet.id })
        }
        return 'published and tracking'
      })
      console.log(`${entry.slug}: ${result}`)
    }
    console.log(JSON.stringify(await calculateAndStoreMomentum()))
  } finally {
    await getPool().end()
  }
}
