# Sponsorship and product measurement: implementation handoff

Implemented 6 September 2026. No database changes, migrations, ad network, payment provider, advertiser outreach, or active campaigns. Production deployment and commercial validation remain separate steps.

## What is available

- `/advertise`: sponsorship policy, proposed pilot scope, honest audience-baseline limitations, and an email inquiry link only when a valid owner-supplied inbox is configured. The footer and sitemap link to it.
- First-party sponsor cards on explicitly selected category and guide pages. An empty approved-campaign list renders no card or reserved ad space. No arbitrary HTML, scripts, remote images or tracking pixels are supported.
- Optional aggregate product events through the existing `/api/telemetry` endpoint and existing log/sink pipeline.
- `pnpm product:report /absolute/path/to/export.ndjson`: offline daily counts by coarse page group and event. The file must contain one JSON object per line with `receivedAt` and `event`, as emitted by the telemetry route. Normalize provider-specific log envelopes during export; include each record once. Do not pass credentials or raw request logs.

## Turn on measurement deliberately

Better Stack is now supported through its server-only Node SDK using the same OBSERVABILITY variables; see [the connection handoff](better-stack-setup.md). Other HTTPS sinks retain the generic JSON transport. The SDK does not enable product events by itself.

1. Configure production log export or the existing `OBSERVABILITY_INGEST_URL`/token. Assign an operator, access controls and retention/deletion policy; a proposed starting retention is 30 days, not an already configured policy. Hosting request logs have separate settings.
2. Review the privacy page and actual hosting/provider behavior. This implementation is data-minimizing, not a legal determination that consent is unnecessary. The pre-existing optional third-party analytics script has separate behavior and is not configured by this change.
3. Set both `VITE_PRODUCT_ANALYTICS_ENABLED=true` and `PRODUCT_ANALYTICS_ENABLED=true` in the intended deployment. Rebuild/redeploy because `VITE_` settings are compiled into the client. Both default off; no `.env` credentials/settings were changed automatically.
4. Verify a public page event and a successful starter copy in exported logs; verify no product events on account/admin/auth pages and none under Do Not Track or Global Privacy Control. Avoid synthetic production traffic during audience measurement.
5. Export a baseline and run the report. Do not equate these events with human reach, unique users, geography, retention or cross-page funnel conversion. Those require a separately chosen measurement approach and production evidence.

The event payload contains only `kind: product`, an allowlisted action and an allowlisted route group. No cookies or persistent IDs are created; fetch omits credentials. There is no prompt, query, referrer, full URL, campaign ID, destination, email or user-agent field. The server adds receipt time. Provider/hosting infrastructure can still process IP and request metadata outside this payload.

Events: `page_view`, `search_result_click`, `outbound_click`, `starter_copy`, `starter_download`, `sponsor_click`, `sponsor_inquiry`. Copy is counted after the clipboard API succeeds; manual fallback copies are not measurable. A download records a browser download request, not proof of a saved file. An inquiry records a mailto click, not an email received. Pageviews count visible pathname transitions, not query-only changes. Disabled flags, privacy preferences, hidden pages, blockers and the 60-event document cap cause undercounting. Bots, repeated visits and duplicated exports can inflate counts.

The endpoint rejects unknown product fields and cross-origin product events, honors privacy headers, and caps product events at 1,000 per minute per server instance. This is a bounded volume safeguard, not bot detection or a global distributed quota. Configure production WAF/log-budget controls before exposure at scale. Never bill advertisers using these raw totals as verified impressions. There is no sponsor-impression/viewability measurement in this first iteration.

## Open inquiries

Set `VITE_SPONSOR_CONTACT_EMAIL` to a real monitored inbox and rebuild. It is public configuration, not a secret. Empty/invalid configuration keeps booking visibly closed. No mailbox is created and no message is sent by this implementation. Confirm receipt with the owner before announcing availability.

## Approve a campaign

Edit the empty `approvedCampaigns` list in `src/features/sponsorships/config.ts` only after creative, relevance, price, dates, reporting and cancellation/make-good terms are approved. Example shape (illustrative, not active):

```ts
{
  enabled: true,
  name: 'Approved sponsor name',
  message: 'Approved plain-text message, up to 180 characters.',
  destination: 'https://approved-vendor.example/product',
  startsAt: '2026-10-01T00:00:00Z',
  endsAt: '2026-10-29T00:00:00Z',
  placements: ['/mobile', '/guides/approved-existing-guide-slug'],
}
```

Only valid HTTPS destinations without embedded credentials are accepted. Invalid, disabled, not-yet-started or expired campaigns do not render. End time is exclusive. The loader timestamp keeps server output and initial hydration consistent; a client timer refreshes scheduled visibility. Verify deployment caching and clock correctness before a timed sale. Remove completed campaigns during housekeeping. Avoid overlapping campaigns: the first eligible campaign wins, there is no rotation or campaign-level attribution.

Cards say “Sponsored · Paid placement,” use paid-link attributes, and explicitly disclaim editorial endorsement. They are not inserted into ranking queries or copied prompts. No card is placed on auth, admin, account, project detail, search, or error pages. A live pilot still needs mobile/desktop creative QA, layout/performance checks, and owner approval; the empty configuration cannot prove the appearance or economics of a real creative.

Pause by removing the campaign or setting `enabled: false`, then deploying. Client expiry works only for an already-delivered configuration; deploying a change is required for a manual global stop. Network exclusivity and consent requirements must be reviewed separately before adding any third-party ad system.

## Remaining commercial gates

Real inbox; deployed release; log retention/export; verified human-audience baseline from an appropriate source; business/invoicing owner; approved advertiser and creative; commercial terms; and an agreed reporting definition. None are replaced by a sponsor card component. Keep the original [product roadmap](product-development-and-monetization-roadmap.md) and [monetization research](monetization-research.md) as the experiment plan.
