# Phase 5 — Operational hardening (in progress)

## Implemented: first operational slice

- `/admin/operations`: editor-authorized, private/no-store snapshot with published inventory, unique linked repository freshness, a 95% target indicator, moderation backlog, items waiting at least three days, and open abuse-report counts.
- An editorial reminder queue based on missing/old source dates, last publication review, unknown pricing, missing open-source license, and basic content gaps. The initial review interval is 30 days. This is an operational policy, not an external requirement.
- The public `/api/health` endpoint returns only `{ "ok": true }` or a generic 503 response. It no longer exposes database names or raw exception messages; responses are not cached.
- Vercel response headers disable framing, MIME sniffing, unused sensitive browser permissions, embedded objects, and foreign base URLs. Referrers use `strict-origin-when-cross-origin`. This is a limited CSP baseline, not a complete script policy or completed security audit.

No dependency installation, schema change, migration, database initialization, or new test is needed for this slice. Use `pnpm dev` with the existing configured environment. The operations page requires a real invited editor/admin account; never bypass authorization to inspect it.

## Important interpretation limits

The repository percentage counts each repository once and only includes links to published projects. Archived, private, disabled, and manually excluded repositories are outside the active denominator. An empty denominator displays N/A rather than a successful target. Freshness is not ranking confidence or confirmation that the collector schedule is running.

Review dates currently describe publication review and stored source checks, not separate pricing/license attestations. The dashboard deliberately does not claim that volatile claims have passed the launch gate. Check the actual maintainer sources, pricing pages, license text, and links before using the existing audited publication workflow. Do not republish unchanged content simply to clear a reminder. Dedicated claim verification tracking remains future work.

The moderation age is time since submission, not time since the last editor response; changes-requested items are excluded. Reminders are visible on demand, not scheduled emails. No arbitrary third-party URLs are fetched by this dashboard.

## Every 2–3 days

1. Assigned editor opens Operations and triages abuse reports first.
2. Review submitted/under-review items, prioritizing items older than three days. Request concrete changes or record a reasoned decision in the existing moderation queue.
3. Check delayed/stale GitHub repositories and collector logs. Do not disable repositories merely to improve the healthy percentage. Preserve last-good observations; document exclusion reasons.
4. Work the editorial reminders: verify pricing and license claims against primary sources, inspect broken links manually, review descriptions and tradeoffs, then save/publish through the existing audited workflow when appropriate.
5. Record the owner, date, decisions, unresolved items, and next review date in the release tracker. An empty dashboard is not general-availability signoff.

## Verification

Run existing checks: `pnpm generate-routes`, `pnpm typecheck`, `pnpm exec eslint`, `pnpm test`, and `pnpm build`. Do not add tests or initialize a database.

With an existing authorized preview environment, verify signed-out users cannot access the dashboard or server function, editors can see live data, and HTML/server-function responses are private/no-store. Check an empty inventory renders N/A, shared repositories count once, and delayed/stale rows link to the existing metric controls. These scenarios must use existing data or a separately authorized fixture workflow, not an ad hoc database.

Verify `/api/health` is no-store and does not reveal database identifiers or exception text. Do not break a live database to exercise failure behavior. On Vercel, inspect response headers with `curl -I https://<deployment>/`; `vercel.json` headers are deployment rules and are not applied by `pnpm dev`. Confirm Google/GitHub sign-in and OTP still work after deployment. A full nonce-based script CSP requires a separate framework integration review.

## Link monitoring — second slice

`/admin/links` lists the latest saved observation for each unique published project link or source, with links back to affected editor pages. It excludes draft-only and removed URLs from the report. Viewing it does not make network requests. The report is editor-authorized, noindex, and private/no-store; it is separate from Operations so a pending migration does not break the existing dashboard.

Migration `0008_ambitious_scalphunter.sql` creates `link_checks`. It was generated from the schema without applying it or initializing a database. Before enabling the monitor, an operator must apply `pnpm db:migrate` to the intended existing database. This command applies any other pending migrations too: inspect the migration history first. No migration is automatic on app startup.

Set `LINK_CHECK_ALLOWED_HOSTS` to a comma-separated list of exact, reviewed public hostnames (for example `github.com,nextjs.org`). No wildcards or implied subdomains. Keep `CRON_SECRET` configured. The Vercel job `/api/jobs/links` is scheduled daily at 04:37 UTC and authenticates using the bearer secret. Without an allowlist it fails closed with 503 and performs no checks. Deployment/scheduler activation was not performed here.

Each job checks at most 40 least-recently-checked URLs, with four workers and no new network work started after 40 seconds. Each request allows up to 1.5 seconds for DNS and 3.5 seconds for HTTPS. Database latency is additional; configure the production function duration with adequate headroom (at least 60 seconds) and monitor failed invocations. Saved observations survive partial runs. Existing collector locking prevents concurrent runs; validate advisory-lock compatibility with the selected Postgres pooler in deployment. Each URL has a minimum one-day recheck interval; actual coverage is approximately `ceil(URL count / 40)` successful daily runs, potentially longer after timeouts. Check report timestamps, not just HTTP success.

Safety boundaries:

- Only HTTPS on port 443, exact approved DNS hostnames, no credentials or query strings, no IP literals. Query-bearing URLs are reported blocked, not silently checked without their query.
- A-only DNS resolution, all returned IPv4 addresses checked against a conservative reserved/private denylist, and the validated IP pinned as the TCP destination. IPv6-only sites are unsupported. The entire 192/8 range is conservatively blocked, including some public addresses. TLS still verifies the original hostname; no second resolution or proxy is used.
- HEAD only; no body ingestion, cookies, authorization headers, GET fallback, or automatic redirects. Redirect destinations are neither fetched nor trusted. Headers have a 16KB limit.
- Only 404/410 are labeled broken. Redirects, denied/unsupported HEAD requests, rate limits, DNS/TLS errors, and timeouts have distinct statuses requiring human review. Successful responses do not verify pricing, licensing, or page content.
- One latest observation per original URL hash is stored; this is not an append-only history. Removed URLs disappear from the report but their stored observations remain until a separately approved retention cleanup.

Do not expose an arbitrary-URL check endpoint or broaden the allowlist automatically from submissions. Add network-level egress controls in production as defense in depth. No collector was executed against the catalog during implementation because the migration has not been applied.

References: [OWASP SSRF prevention](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html) and [Node HTTPS request options](https://nodejs.org/api/https.html).

## Additional hardening implemented

Telemetry now reads at most 16KB with a two-second incoming-body deadline, validates event shapes, drops unknown fields/raw error content, stores coarse route groups, and bounds forwarding to two seconds without redirects. Explicit cross-site browser submissions are rejected. This is not a distributed abuse-rate limiter; production edge limits and provider retention/access controls still require operator setup. On 6 September the approximate performance observers were replaced with the official Web Vitals library; see the [Phase 6 runbook](phase-6-runbook.md). Representative production measurement is still required.

Weekly Dependabot update configuration is included for npm/pnpm dependencies. It only takes effect when configured in the hosted repository; security alerts/updates and branch protections must be enabled and verified by its owner. It does not automatically merge changes or resolve the existing esbuild advisory. Environment variants are now ignored by Git except `.env.example`; this does not remove anything already present in history.

The [incident/recovery procedure](incident-and-recovery.md) covers response, containment approval, compatible code rollback, backup/object scope, and a separately authorized isolated recovery drill. It remains unsigned and untested operationally.

## Latest local validation

Update, 6 September: the owner applied migration 0008, and a read-only inspection confirmed all six expected `link_checks` columns in the configured database. Collector execution and authenticated report checks remain pending. The earlier “not applied” notes below describe implementation-time history, not current configured schema state.

Typecheck, ESLint, all nine existing tests, and production build passed after link-monitor and telemetry changes. Signed-out `/admin/links` redirects to sign-in; the job rejects missing credentials with 401; malformed telemetry returns 400. No new tests were added. No migration or collector was run. Authenticated report rendering, real link checking/persistence, deployed scheduling/headers, screen-reader behavior, and recovery are unverified.

## Open launch gates

### Local verification — 5 September 2026

Route generation, typechecking, ESLint, all nine existing tests, and the production build passed. The running local app returned `200 {"ok":true}` with `Cache-Control: no-store` from `/api/health`. An unauthenticated request to `/admin/operations` returned a 307 redirect to sign-in with the correct return path. Authenticated dashboard rendering and Vercel header behavior remain unverified; no editor session was fabricated.

`pnpm audit --prod --audit-level moderate` reported one moderate advisory and exited 1: [GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99), affecting transitive `esbuild@0.18.20` through Drizzle Kit's legacy loader dependency. The advisory concerns esbuild's serve feature; this finding alone does not establish exploitability in the deployed application. No high/critical advisory was reported by that scan. Dependency versions were not overridden blindly; a compatible dependency-chain update and rescan remain open. Do not run the affected esbuild serve feature.

- Deploy and verify the opt-in broken-link monitor, migration, allowlist, function duration, locking, and full-catalog coverage. Network-level egress controls remain an operator responsibility.
- Dedicated pricing/license verification evidence; full content and image/license/trademark audit.
- Dependency scanning automation and secrets review, including repository history and deployment configuration. Never include secret values in reports.
- Incident and recovery procedures validated by named operational owners.
- Backup restore drill: **not performed or authorized here**. The workspace prohibits database initialization. An operator must arrange an explicitly authorized isolated environment and prove recovery before launch; do not restore over production.
- Performance/cache/failure-mode assessment using existing checks and approved environments; no production load generation without agreement.
- Automated accessibility assessment plus manual keyboard, screen-reader, mobile reflow, and auth/submission checks.
- Production field metrics, search benchmark evidence, and five-participant usability evaluation from the implementation guide.

## Deployment evidence and ownership

| Gate                                    | Owner      | Evidence                            | Status |
| --------------------------------------- | ---------- | ----------------------------------- | ------ |
| Operations dashboard/auth/cache         | Unassigned | Pending deployed checks             | Open   |
| Editorial rota and claim/asset audit    | Unassigned | Pending review log                  | Open   |
| Collector freshness and alerting        | Unassigned | Pending production observation      | Open   |
| Security/dependencies/incident response | Unassigned | Pending audit                       | Open   |
| Backup recovery                         | Unassigned | Pending separately authorized drill | Open   |
| Accessibility/performance/usability     | Unassigned | Pending audit and field evidence    | Open   |

Phase 5 is complete only when the measurable launch criteria in `Implementation guide.md` pass, operational owners are named, and the 2–3 day maintenance cadence has been demonstrated. Code compilation alone does not satisfy this gate.

## References checked

- [Vercel project configuration](https://vercel.com/docs/project-configuration/vercel-json) for deployment response-header rules.
- [OWASP HTTP headers guidance](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html) for the limited header baseline and browser compatibility considerations.
