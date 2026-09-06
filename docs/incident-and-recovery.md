# Incident and recovery procedure

Status: procedure drafted; no recovery drill performed. This document is not authorization to modify a database, revoke credentials, deploy, delete data, or contact users.

## Roles and triggers

Assign a primary operator, backup operator, editorial lead, and privacy/security contact before launch. Store their private contact details in the team's access-controlled tracker, not this repository. Escalate suspected credential/data exposure immediately. Treat sustained health failures, sign-in failures, publication corruption, and a collector missing two expected runs as incidents. Proposed response targets: acknowledge critical incidents within 30 minutes during explicitly agreed coverage; do not advertise 24/7 support until staffed.

## First response

1. Record UTC start, observed symptoms, affected routes, last successful operation, release identifier, and incident owner. Preserve redacted logs and relevant audit-event IDs; never paste cookies, OTPs, authorization headers, or connection strings.
2. Use read-only checks to distinguish deployment, database, DNS, OAuth/email, collector, and telemetry-provider failures. The generic health endpoint intentionally omits diagnostics; use restricted provider logs.
3. Select the narrowest containment and get operator approval: pause a failing job, disable an affected integration, or restrict contributions. For suspected credential compromise, rotate at the issuing provider and update dependent environments in an agreed order; revoke affected sessions when warranted. Preserve evidence first where safe.
4. Prefer rolling back application code to a known compatible release. Confirm compatibility with already-applied migrations. Never reverse or reset a database solely to make a code rollback work. Additive `link_checks` can remain unused after reverting the monitor.
5. Communicate confirmed impact and next update time through the agreed status channel. Do not speculate about data loss. The responsible operator/legal contact decides notification obligations.
6. Verify recovery with public browsing, real authorized auth/editor workflows, job history, and audit continuity. Monitor at least one complete scheduled-job cycle. Document cause, duration, data impact, remediation, and assigned follow-ups.

## Backup scope and recovery evidence

Inventory database backup retention, earliest/latest restore point, encryption/access policy, and provider plan. Define and approve business targets for recovery-point and recovery-time objectives; an initial proposal is 24-hour RPO and four-hour RTO, not an achieved commitment.

Database backup alone is insufficient. Supabase documents that database backups exclude Storage API objects, and custom-role passwords are not included in daily backups. Inventory independent object copies/versions, asset manifests and checksums, environment settings, provider configuration, OAuth callbacks, email DNS, and migration versions. Keep secrets in the approved secret manager. [Supabase backup documentation](https://supabase.com/docs/guides/platform/backups).

The workspace explicitly prohibits database initialization. **Do not execute a restore here.** A designated operator must obtain separate authorization for an isolated non-production restore destination and approved handling of personal data. No restoration may overwrite production as a verification step.

For that separately authorized drill, record the source restore point, isolated destination identifier, approval, start/end timestamps, and resulting RPO/RTO. Restrict network access; prevent restored cron/email/OAuth integrations from contacting real users. Verify schema/migration history, published/draft isolation, record counts, source links, asset checksum availability, attribution of publication/moderation events, and account/session handling. Record discrepancies. Re-enable nothing against production as part of the drill. Agree on retention/disposal of the isolated restored data separately.

## Retention and audit register

Before launch, approve retention periods for accounts/sessions, contributions, rate-limit counters, zero-result searches, provider logs, telemetry, audit events, and orphaned link observations. The current code does not claim automated cleanup for all of these. Distinguish user deletion from legally justified audit retention, record who may export data, and document fulfillment of privacy requests. Never delete records under a generic cleanup instruction without exact scope and approval.

## Evidence template

- Incident/drill ID and UTC dates:
- Owner / approver:
- Source and isolated destination identifiers (no secrets):
- Release and migration versions:
- Backup/object coverage:
- Measured RPO/RTO versus approved targets:
- Auth, publication, moderation, assets, and collector validation:
- Remaining discrepancies and assigned actions:
- Approval to close:
