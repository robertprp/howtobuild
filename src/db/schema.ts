import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  real,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
})

export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => [index('session_user_id_idx').on(table.userId)],
)

export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    issuer: text('issuer').notNull(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', {
      withTimezone: true,
    }),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('account_user_id_idx').on(table.userId),
    uniqueIndex('account_issuer_account_idx').on(table.issuer, table.accountId),
  ],
)

export const verification = pgTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('verification_identifier_idx').on(table.identifier)],
)

export const repositories = pgTable(
  'repositories',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    githubNodeId: text('github_node_id').notNull().unique(),
    owner: text('owner').notNull(),
    name: text('name').notNull(),
    etag: text('etag'),
    htmlUrl: text('html_url'),
    defaultBranch: text('default_branch'),
    archived: boolean('archived').default(false).notNull(),
    private: boolean('private').default(false).notNull(),
    manuallyExcluded: boolean('manually_excluded').default(false).notNull(),
    exclusionReason: text('exclusion_reason'),
    syncStatus: text('sync_status').default('pending').notNull(),
    lastAttemptAt: timestamp('last_attempt_at', { withTimezone: true }),
    lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
    lastError: text('last_error'),
    consecutiveFailures: integer('consecutive_failures').default(0).notNull(),
  },
  (table) => [
    uniqueIndex('repository_owner_name_idx').on(table.owner, table.name),
  ],
)

export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  accent: text('accent').notNull(),
  sortOrder: integer('sort_order').notNull(),
})

export const facets = pgTable(
  'facets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    kind: text('kind').notNull(),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    description: text('description'),
  },
  (table) => [uniqueIndex('facet_kind_slug_idx').on(table.kind, table.slug)],
)

export const projects = pgTable(
  'projects',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    slug: text('slug').notNull().unique(),
    name: text('name').notNull(),
    shortDescription: text('short_description').notNull(),
    editorialDescription: text('editorial_description').notNull(),
    whyInteresting: text('why_interesting').notNull(),
    bestFor: jsonb('best_for').$type<string[]>().notNull(),
    notIdealFor: jsonb('not_ideal_for').$type<string[]>().notNull(),
    projectType: text('project_type').notNull(),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id),
    status: text('status').default('draft').notNull(),
    openSource: boolean('open_source').default(false).notNull(),
    license: text('license'),
    selfHostable: boolean('self_hostable').default(false).notNull(),
    pricingLabel: text('pricing_label').default('Unknown').notNull(),
    pricingSummary: text('pricing_summary').notNull(),
    recommended: boolean('recommended').default(false).notNull(),
    worthWatching: boolean('worth_watching').default(false).notNull(),
    createdBy: text('created_by').references(() => user.id),
    updatedBy: text('updated_by').references(() => user.id),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    publishedAt: timestamp('published_at', { withTimezone: true }),
  },
  (table) => [
    index('project_category_status_idx').on(table.categoryId, table.status),
  ],
)

export const projectLinks = pgTable(
  'project_links',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    kind: text('kind').notNull(),
    url: text('url').notNull(),
    lastSuccessfulCheckAt: timestamp('last_successful_check_at', {
      withTimezone: true,
    }),
    redirectTarget: text('redirect_target'),
    failureCount: integer('failure_count').default(0).notNull(),
  },
  (table) => [
    uniqueIndex('project_link_kind_idx').on(table.projectId, table.kind),
  ],
)

export const projectRepositories = pgTable(
  'project_repositories',
  {
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    repositoryId: uuid('repository_id')
      .notNull()
      .references(() => repositories.id, { onDelete: 'cascade' }),
    isDefault: boolean('is_default').default(false).notNull(),
  },
  (table) => [
    uniqueIndex('project_repository_idx').on(
      table.projectId,
      table.repositoryId,
    ),
  ],
)

export const projectSources = pgTable('project_sources', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  claim: text('claim').notNull(),
  sourceType: text('source_type').notNull(),
  url: text('url').notNull(),
  checkedAt: timestamp('checked_at', { withTimezone: true }).notNull(),
  checkedBy: text('checked_by'),
})

export const projectFacets = pgTable(
  'project_facets',
  {
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    facetId: uuid('facet_id')
      .notNull()
      .references(() => facets.id, { onDelete: 'cascade' }),
  },
  (table) => [
    uniqueIndex('project_facet_idx').on(table.projectId, table.facetId),
  ],
)

export const assets = pgTable('assets', {
  id: uuid('id').defaultRandom().primaryKey(),
  kind: text('kind').notNull(),
  storageKey: text('storage_key').notNull().unique(),
  sourceUrl: text('source_url').notNull(),
  creator: text('creator'),
  license: text('license').notNull(),
  capturedAt: timestamp('captured_at', { withTimezone: true }).notNull(),
  altText: text('alt_text').notNull(),
  focalX: integer('focal_x').default(50).notNull(),
  focalY: integer('focal_y').default(50).notNull(),
  width: integer('width'),
  height: integer('height'),
  checksum: text('checksum').notNull(),
  manifest: jsonb('manifest').notNull(),
})

export const projectAssets = pgTable(
  'project_assets',
  {
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    assetId: uuid('asset_id')
      .notNull()
      .references(() => assets.id, { onDelete: 'cascade' }),
    role: text('role').notNull(),
  },
  (table) => [
    uniqueIndex('project_asset_role_idx').on(table.projectId, table.role),
  ],
)

export const editorInvites = pgTable('editor_invites', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  role: text('role').default('editor').notNull(),
  invitedBy: text('invited_by').references(() => user.id),
  invitedAt: timestamp('invited_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
})

export const editorRoles = pgTable('editor_roles', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  role: text('role').notNull(),
  grantedBy: text('granted_by').references(() => user.id),
  grantedAt: timestamp('granted_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
})

export const editorialRevisions = pgTable(
  'editorial_revisions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    revision: integer('revision').notNull(),
    snapshot: jsonb('snapshot').notNull(),
    reason: text('reason').notNull(),
    actorId: text('actor_id')
      .notNull()
      .references(() => user.id),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('editorial_revision_project_number_idx').on(
      table.projectId,
      table.revision,
    ),
  ],
)

export const auditEvents = pgTable('audit_events', {
  id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
  actorId: text('actor_id')
    .notNull()
    .references(() => user.id),
  projectId: uuid('project_id').references(() => projects.id, {
    onDelete: 'set null',
  }),
  action: text('action').notNull(),
  reason: text('reason').notNull(),
  before: jsonb('before'),
  after: jsonb('after'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
})

export const projectRedirects = pgTable('project_redirects', {
  oldSlug: text('old_slug').primaryKey(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
})

export const githubSnapshots = pgTable(
  'github_snapshots',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    repositoryId: uuid('repository_id')
      .notNull()
      .references(() => repositories.id, { onDelete: 'cascade' }),
    observedAt: timestamp('observed_at', { withTimezone: true }).notNull(),
    stars: integer('stars').notNull(),
    forks: integer('forks').notNull(),
    openIssues: integer('open_issues').notNull(),
    pushedAt: timestamp('pushed_at', { withTimezone: true }),
    latestReleaseAt: timestamp('latest_release_at', { withTimezone: true }),
    responseEtag: text('response_etag'),
    requestOutcome: text('request_outcome').default('200').notNull(),
    collectorVersion: text('collector_version').default('v1').notNull(),
    raw: jsonb('raw').notNull(),
  },
  (table) => [
    uniqueIndex('github_snapshot_repository_observed_idx').on(
      table.repositoryId,
      table.observedAt,
    ),
    index('github_snapshot_repository_idx').on(table.repositoryId),
  ],
)

export const projectMomentum = pgTable(
  'project_momentum',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    calculatedAt: timestamp('calculated_at', { withTimezone: true }).notNull(),
    currentSnapshotId: uuid('current_snapshot_id')
      .notNull()
      .references(() => githubSnapshots.id, { onDelete: 'cascade' }),
    weeklySnapshotId: uuid('weekly_snapshot_id').references(
      () => githubSnapshots.id,
      { onDelete: 'set null' },
    ),
    monthlySnapshotId: uuid('monthly_snapshot_id').references(
      () => githubSnapshots.id,
      { onDelete: 'set null' },
    ),
    stars: integer('stars').notNull(),
    absolute7d: integer('absolute_7d'),
    absolute30d: integer('absolute_30d'),
    relative7d: real('relative_7d'),
    relative30d: real('relative_30d'),
    activityFactor: real('activity_factor').notNull(),
    score: real('score'),
    confidence: text('confidence').notNull(),
    windowStart: timestamp('window_start', { withTimezone: true }),
    windowEnd: timestamp('window_end', { withTimezone: true }).notNull(),
    anomaly: boolean('anomaly').default(false).notNull(),
    anomalyReasons: jsonb('anomaly_reasons').$type<string[]>().notNull(),
    algorithmVersion: text('algorithm_version').notNull(),
  },
  (table) => [
    uniqueIndex('project_momentum_project_calculated_idx').on(
      table.projectId,
      table.calculatedAt,
    ),
    index('project_momentum_rank_idx').on(table.calculatedAt, table.score),
  ],
)

export const searchAliases = pgTable(
  'search_aliases',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    alias: text('alias').notNull(),
    normalizedAlias: text('normalized_alias').notNull(),
  },
  (table) => [
    uniqueIndex('search_alias_project_normalized_idx').on(
      table.projectId,
      table.normalizedAlias,
    ),
    index('search_alias_normalized_idx').on(table.normalizedAlias),
  ],
)

export const searchZeroResults = pgTable('search_zero_results', {
  queryHash: text('query_hash').primaryKey(),
  normalizedQuery: text('normalized_query').notNull(),
  count: integer('count').default(1).notNull(),
  firstSeenAt: timestamp('first_seen_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
})

export const collectorLeases = pgTable('collector_leases', {
  name: text('name').primaryKey(),
  holder: text('holder').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
})

export const phaseZeroChecks = pgTable('phase_zero_checks', {
  id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
  name: text('name').notNull(),
  checkedAt: timestamp('checked_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
})

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}))

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}))

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}))

export const schema = {
  account,
  accountRelations,
  assets,
  auditEvents,
  categories,
  collectorLeases,
  editorialRevisions,
  editorInvites,
  editorRoles,
  facets,
  githubSnapshots,
  projectMomentum,
  phaseZeroChecks,
  projectAssets,
  projectFacets,
  projectLinks,
  projectRedirects,
  projectRepositories,
  projects,
  projectSources,
  repositories,
  searchAliases,
  searchZeroResults,
  session,
  sessionRelations,
  user,
  userRelations,
  verification,
}
