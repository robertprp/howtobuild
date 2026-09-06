# Phase 6 — Launch readiness and measurement

Status: local implementation in progress; production signoff remains open. Scope follows the launch-readiness proposal and the owner's request to continue on 6 September 2026. No monetization is included.

## Implemented measurement layer

The browser now uses pinned `web-vitals@6.2.1` for CLS, INP, and LCP instead of hand-rolled approximations. The standard library is dynamically loaded, registered once per document, and does not send attribution/DOM data. Full-document navigation measurement is used; experimental soft-navigation reporting is not enabled. Unsupported/unavailable metrics are absent, not fabricated as zero. [Official library guidance](https://github.com/GoogleChrome/web-vitals).

Accepted events have `kind: web-vitals`, `source: web-vitals/6.2.1`, coarse route group, entry viewport, and metric name/value/ID/sequence/navigation type. Metric IDs identify a measurement instance, not an account, and are not persisted in browser storage. IDs let the ingest consumer replace older updates with the highest sequence for that metric. Do not count every visibility-change report as a different visit. No query strings, full URLs, cookies, error messages, or DOM selectors are sent. Error-category reporting is capped at twenty events per document; this is not server-side abuse protection.

Deploy client and server together: the server rejects old approximate events lacking the version and metric identity. Do not mix historical proxy measurements with the new standard-library results. Forwarding remains optional and uses the configured telemetry sink; it does not store an analytics database automatically.

## Offline performance report

Export the existing sink's raw records as NDJSON, one JSON object per line with an `event` property matching the ingestion record. This must be a deliberately selected production time window, not arbitrary logs with prefixes or a browser console dump. Keep exports outside the repository in approved storage.

```sh
pnpm metrics:report /absolute/path/to/telemetry.ndjson
```

The command is read-only: no network, database, upload, or file output. It ignores malformed/legacy records, deduplicates each metric ID/name using the highest client sequence, and calculates nearest-rank p75 grouped by coarse route and entry viewport width. Narrow means ≤767px; wide means >767px. These are viewport cohorts, not verified mobile/desktop device classes. IDs and raw records are never printed.

Thresholds are CLS ≤0.1, INP ≤200ms, and LCP ≤2500ms. Groups below fifty observations are labeled insufficient under our internal reporting policy, not a Google-mandated sample size. Larger samples do not automatically prove representativeness. Verify export completeness, time window, production source, unsupported browser gaps, bot/dev traffic, and actual device cohorts before launch signoff. Public telemetry is untrusted and is not a billing, audience, or advertising ledger.

An empty export prints an empty group list, never a passed performance gate. No production telemetry was exported or analyzed during implementation.

## Migration evidence — 6 September 2026

The owner reported applying migration 0008. A read-only inspection of the configured database confirmed `public.link_checks` with the expected six columns and types. No migration, database initialization, collector, or result write was performed by the assistant. This confirms local configured schema availability, not migration state of every deployment.

## Release checklist

- Record commit, deployment URL, production owner, rollback-compatible release, applied migration ledger, and approved environment changes.
- Confirm editor access to `/admin/operations` and `/admin/links` without fabricated sessions, and private/no-store behavior for both HTML and server functions.
- Configure exact link-check hostname allowlist and observe authorized job execution, saved results, denied targets, duration, coverage, and failure routing. Validate collector locking for the chosen connection/pooler mode.
- Verify real OAuth/OTP/session/submission/moderation workflows using approved accounts/content. The code field now receives focus after requesting an OTP, and email input is locked while the request is pending; browser/screen-reader verification remains required.
- Run existing typecheck/lint/tests/build. Review dependency advisory status separately; a successful build does not remediate an advisory.
- Complete keyboard, screen-reader, zoom/reflow, reduced-motion and automated accessibility audits. Complete content and asset/license provenance review.
- Validate production headers, canonical/robots/sitemap/404 behavior and Search Console setup through owner-authorized access.
- Collect a representative performance window and use the reporting command alongside browser/provider measurements. Complete usability/search acceptance evidence.
- Obtain the named operators' incident/recovery and editorial-cadence signoff. The isolated backup-restore drill requires separate explicit authorization and is not permitted under current workspace instructions.

## Exit evidence

Production URL: pending. Release commit: pending (changes uncommitted). Operator: unassigned. Authenticated workflows: pending. Scheduled job cycle: pending. Performance sample: pending. Accessibility/provenance audits: pending. Recovery drill: pending. Monetization: research-only in `monetization-research.md`.

Phase 6 is not complete until these real-world checks are signed off; this runbook does not substitute for them.
