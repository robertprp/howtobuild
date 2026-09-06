# HowToBuild.dev

Phase 4 adds authenticated community project submissions, edit suggestions, moderation, contribution status, and abuse controls to the public-beta field guide.

Phase 5 is underway: `/admin/operations` adds repository-health summaries, moderation backlog counts, and editorial review reminders. This first slice also hardens the public health response and adds Vercel security headers. It requires no new migration. See the [Phase 5 runbook](docs/phase-5-runbook.md) for limitations and the remaining launch gates.

The next Phase 5 slice adds `/admin/links` and an opt-in daily link monitor. It requires migration `0008_ambitious_scalphunter.sql` (generated, not applied here), `CRON_SECRET`, and an explicit `LINK_CHECK_ALLOWED_HOSTS` allowlist. Apply the migration against the intended existing database before enabling the monitor. Migrations still do not run automatically.

Further hardening bounds and validates telemetry, removes raw error/path data from those events, and adds dependency-update configuration and an [incident/recovery procedure](docs/incident-and-recovery.md). Phase 5 launch signoff remains open. [Phase 6 launch readiness](docs/phase-6-runbook.md) now includes official Web Vitals measurement and a read-only `pnpm metrics:report /path/to/telemetry.ndjson` command. Migration 0008 was owner-applied and its table verified read-only on 6 September. [Monetization research](docs/monetization-research.md) proposes later experiments; no monetization is implemented.

## Run locally

Requirements: Node 22–26, pnpm 9, and an already configured Postgres database. Fill in `.env` before running migrations; do not overwrite an existing `.env`.

```sh
pnpm install
cp .env.example .env
pnpm db:migrate
pnpm editor:invite you@example.com admin
pnpm dev
```

Open `http://localhost:3000`. The migrations install 39 representative published projects across all six categories. Search at `/search`, inspect momentum at `/trending`, and use `/admin/metrics` to review freshness or exclude a repository from automatic ranking.

Migrations do **not** run automatically on `pnpm dev`, `pnpm build`, or `pnpm start`. Run `pnpm db:migrate` explicitly against the intended database before serving updated code. The current changes add migrations `0006` and `0007`; they have not been applied during verification.

## Included through Phase 4

- Public GitHub, Google, and email OTP accounts with account/session controls
- GitHub-assisted project submission, guidelines, contributor status history, and factual edit suggestions
- An editor-only moderation queue with reasoned state changes and a separate append-only event trail
- Canonical GitHub validation, duplicate detection, honeypots, minimum-fill timing, per-account and privacy-preserving per-IP rate limits, and abuse reporting

- A stack directory and four launch stack guides with responsibility maps, rationale, cost and open-source profiles, alternatives, tradeoffs, and sources
- Stack starter selectors with a dark copyable prompt and `.md` download; researched Better Auth/Clerk and shadcn/ui/Mantine choices for the Next.js SaaS stacks
- Stack-aware search, homepage recommendations, project-to-stack connections, canonical metadata, and sitemap entries
- Methodology, About, corrections, privacy, and terms pages
- Optional web analytics plus first-party browser error and Core Web Vitals collection with an optional production ingest sink

- Full-document SSR search, filters, trending, six categories, and permanent ecosystem routes
- Weighted Postgres full-text search with a GIN index, aliases, and privacy-preserving zero-result aggregation
- Serial GitHub collection with ETags, retries, redirects, normalized observations, and repository health
- Versioned 7/30/49-day star-growth evidence, actual observation dates, and a trending view sorted by net star gains in the selected window (catalog projects, not all GitHub)
- Public evidence labels plus stale, anomalous, and manually excluded ranking guards
- Private metric-health controls with reasoned audit events
- A 39-project sourced private-alpha catalog
- Project, category, facet, source, link, repository, asset, role, redirect, revision, and audit schema
- Public Better Auth accounts with invite-only, server-side editor/admin authorization
- Transactional draft, revision, publish, unpublish, and slug-redirect workflows
- Private, `noindex` previews that never enter public queries or the sitemap
- Canonical metadata, Open Graph metadata, XML sitemap, robots rules, redirects, and real 404s
- Self-hosted Fraunces and IBM Plex fonts, design tokens, responsive layouts, visible focus, and reduced-motion behavior
- Trending-row, editorial-feature, stack-item, and search-result content variants
- Provenance-aware AVIF/WebP/JPEG image manifests and responsive derivatives

Run the complete code-level gate with:

```sh
pnpm verify
```

Provider and deployment checks are documented in [the Phase 4 runbook](docs/phase-4-runbook.md). Earlier phase runbooks remain available in `docs/`.

Each implementation phase must add a matching `docs/phase-N-runbook.md` containing setup instructions, verification steps, the phase exit gate, and a place to record deployed validation results.
