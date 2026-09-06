# Phase 6 proposal — launch readiness and measurement

Status: historical proposal, now used as the working scope following the owner's request to continue on 6 September 2026. See [the Phase 6 runbook](phase-6-runbook.md) for current implementation and evidence. The original implementation guide defines phases 0–5 only. This document does not declare a new phase complete or authorize production actions.

## Entry gate

Resolve Phase 5's outstanding evidence: migration deployment, authenticated operations/link report, security and dependency findings, claim/asset provenance, accessibility, performance/failure behavior, recovery drill, and named editorial coverage.

## Proposed deliverables

1. Signed release checklist tied to a commit, deployment URL, migration ledger, environment configuration, and rollback-compatible prior release.
2. Confirm production host redirects, indexability, canonical/sitemap consistency, real 404 responses, and secure/no-store behavior of auth and private routes. Submit Search Console sitemap only through owner-authorized access.
3. Verify GitHub collection and link monitoring over complete scheduled cycles, including plan duration/cron limits, freshness coverage, job locking, and actionable failure routing to the named operator.
4. Validate sign-in, OTP, session revocation, submission, moderation, and publication with authorized accounts; do not fabricate sessions or publish test content without approval.
5. Agree on a privacy-reviewed measurement plan: human pageviews, geography mix, acquisition source, project-to-stack usage, starter copy/download intent, returning users, and useful outbound clicks. Existing coarse performance samples do not measure these funnels and must not be sold to advertisers as audience statistics. No billing, ads, sponsor tracking, or paid features in this phase.
6. Assess mobile/desktop p75 Core Web Vitals using a standards-compliant measurement implementation and sufficient field data. The earlier hand-rolled diagnostic proxies have now been replaced by the official library; historical samples must not be mixed with the new measurements. The field-data gate remains open.
7. Conduct five moderated usability sessions and the maintained search benchmark; record actual results against the implementation guide's acceptance targets.

## Exit gate

Owner-approved production evidence, resolved release-blocking findings, measured maintenance cadence, and an honest baseline for a later monetization decision. Requires access and time, not just code changes. Deployments, provider setup, external communications, account creation, and the separately authorized restore exercise are not executed by writing this plan.

## Proposed later work

See `monetization-research.md` for research-only iterations. No monetization implementation should begin without a separate approval after reviewing audience evidence and editorial safeguards.
