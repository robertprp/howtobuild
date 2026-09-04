# Phase 3 stacks and public beta runbook

This runbook covers the Phase 3 implementation: public stack discovery, stack-to-project connections, trust and legal content, optional analytics, error reporting, and Core Web Vitals collection.

## Setup

Use the already configured application database. Do not create, start, reset, or seed a separate database as part of verification.

```sh
pnpm install
pnpm db:migrate
pnpm dev
```

Migration `0005` adds normalized stacks, responsibility items, project-backed alternatives, sources, a weighted full-text index, and four initial published stacks. Applying it is an explicit environment operation and is not part of the code-only verification gate.

## Stack editorial review

- Visit `/stacks` and each of the four launch stack pages.
- Confirm each stack names its target user and early-stage fit.
- Review every responsibility, rationale, open-source and pricing label, alternative, tradeoff, and source against the current primary source.
- Follow every project link from a stack and confirm that the project page links back to each relevant stack.
- Search for `TypeScript SaaS`, `self hosting`, `AI retrieval`, and `observability`; stack results should be labeled separately from project results.
- Confirm drafts cannot appear in public stack queries, search, metadata, or the sitemap.

The initial migration establishes launch content. Ongoing factual changes should be made in the database-backed editorial workflow and must preserve source and review dates.

## Public-beta pages

Review `/methodology`, `/about`, `/corrections`, `/privacy`, and `/terms` with editorial and legal owners. These are launch copy, not a substitute for jurisdiction-specific legal review. Confirm all five pages and all published stacks appear in `/sitemap.xml`.

## Analytics and observability

Browser errors and LCP, INP, and CLS measurements post to `/api/telemetry`. Without an external sink they are emitted as structured hosting logs. To forward them, configure:

```sh
OBSERVABILITY_INGEST_URL=https://your-fixed-ingest-endpoint.example/events
OBSERVABILITY_INGEST_TOKEN=replace-me
```

To enable a privacy-reviewed analytics provider, configure its script and site identifier:

```sh
VITE_ANALYTICS_SCRIPT_URL=https://analytics.example/script.js
VITE_ANALYTICS_SITE_ID=replace-me
```

Leave both analytics variables empty until the provider, data processing terms, retention, consent requirements, and production domain have been reviewed. Never put a secret in a `VITE_` variable.

## Code gate

```sh
pnpm typecheck
pnpm test
pnpm build
```

Also run `pnpm check`. The repository currently has pre-existing Prettier findings in the implementation guide, the Phase 2 snapshot, and an existing asset test, plus pre-existing lint findings in the email service; record those separately from Phase 3 regressions.

Manual release checks remain required for keyboard navigation, screen-reader headings and lists, 200% zoom, 320 CSS px reflow, reduced motion, canonical/404 responses, external source links, the production analytics dashboard, error delivery, and real-user Core Web Vitals.

## Exit gate record

**Preview URL:**  
**Migration applied:** Pending deployed-provider validation.  
**Four stack editorial reviews:** Pending.  
**Legal/editorial owner review:** Pending.  
**Analytics dashboard:** Pending provider selection/configuration.  
**Error event received:** Pending deployed validation.  
**Core Web Vitals event received:** Pending deployed validation.  
**Accessibility review:** Pending.  
**Result:** Code implementation complete; deployed-provider, editorial, legal, and accessibility validation remain pending.
