# HowToBuild: product development and monetization roadmap

Date: 6 September 2026. Status: proposed roadmap, not an implementation or authorization to launch commercial features. Priority order below is a product judgment, not a revenue forecast.

## Where we are—and why there are no ads yet

We discussed monetization and wrote [the detailed research](monetization-research.md), but the earlier instruction explicitly requested research without implementation. The repository currently has no ad-network integration, sponsored placement system, affiliate attribution integration, or HowToBuild checkout/subscription flow. Production settings and externally injected scripts were not independently audited for this document.

Stripe Billing, Persona, and other providers in the stack selector are recommendations for the user's generated starter prompt. They do not monetize this website and do not activate provider accounts.

Existing foundations include the curated catalog, search, stack selection and Markdown prompts, build guides, submissions/moderation, GitHub evidence collection, and operational tooling. The latest mobile expansion brought the configured catalog from six to eighteen mobile projects. These implementation facts are not proof of production deployment, meaningful traffic, or commercial demand. See [catalog expansion](catalog-and-stack-expansion.md) and [launch-readiness evidence](phase-6-runbook.md).

**Recommended direction:** keep discovery and basic prompts free; help people make a decision and begin a build. Validate one relevant direct sponsor, then consider contextual ads when eligible. Sell implementation value before charging for a recurring subscription that does not yet have recurring value.

## Product objective

Help a developer move from “What should I use?” to a justified, compatible stack and a useful first implementation.

Proposed primary outcome: weekly users who make a stack choice and successfully copy or download its starter. This is an activation proxy—not proof they built anything. Confirm actual usefulness through voluntary follow-up interviews. Unique-user measurement requires an explicitly chosen, privacy-reviewed method; do not pretend event counts are unique people.

Supporting measures: relevant search-result clicks, unsuccessful searches, starter completion, outbound documentation clicks, returning usage where measurable, stale-source coverage, collector freshness, and support/editorial hours. Current performance telemetry is not a complete product funnel or advertiser audience report.

## Prioritized product backlog

Effort estimates are rough engineering estimates excluding provider approval, external reviews, and the time needed to observe behavior. Acceptance targets are proposed internal gates, not industry benchmarks.

| Priority | Improvement                               | Why it matters                                                          | First deliverable / acceptance gate                                                                                                                                                                                                                              | Effort                    |
| -------- | ----------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| P0       | Production evidence and audience baseline | Prevents selling imaginary reach or building against misleading metrics | Confirm deployed release, scheduled collection, error reporting, human traffic measurement and monthly operating cost. Record what is still unknown.                                                                                                             | 2–4 days plus observation |
| P0       | Measure the discovery-to-starter funnel   | Shows whether the product helps builders, not just attracts visits      | Document and implement a minimal event schema for search result selection, stack visits, successful copies/downloads and useful outbound clicks. Exclude prompt text, email addresses, secrets and sensitive product briefs.                                     | 2–3 days                  |
| P1       | Guided stack builder                      | A long list of providers is not a decision aid                          | Ask platform, use case, hosting preference and operating constraints; suggest a small compatible baseline. Keep optional KYC/jobs/analytics off unless needed. In five usability sessions, aim for four users to explain their choices without help.             | 4–7 days                  |
| P1       | Shareable stack configurations            | Turns a one-off prompt into something users can revisit and discuss     | Versioned URL or saved configuration preserves selected providers; unknown/removed choices get clear fallback warnings. Do not put private product briefs in public URLs by default.                                                                             | 2–4 days                  |
| P1       | Two- or three-project comparison          | Makes alternatives understandable without opening many tabs             | Compare the same responsibilities, ownership, license, integration constraints and cost drivers, each with sources and checked dates. Never compare auth with KYC as equivalents.                                                                                | 3–5 days                  |
| P1       | Editorial discovery queue                 | Expands coverage sustainably without publishing GitHub noise            | Run topic discovery regularly into a review queue; deduplicate repository transfers, check licenses, and record publish/reject reasons. No auto-publication based on stars. Measure review backlog and freshness, not just catalog count.                        | 3–5 days                  |
| P1       | Outcome-led guides                        | Connects search intent to real product utility                          | Publish three genuinely useful guides, such as an Expo app, subscription SaaS, and optional identity-verification flow. Include tradeoffs, prerequisites, maintained references and a matching starter. Avoid thin pages for every keyword/provider permutation. | 3–6 editorial days        |
| P2       | Compatibility-aware prompts               | Prevents technically plausible but incompatible selections              | Add structured runtime/platform constraints, distinguish hosted services from self-hosted options, and mark unsupported combinations before export. Preserve the current framework gates.                                                                        | 3–5 days                  |
| P2       | Saved shortlists and change updates       | Provides a reason to return                                             | Validate demand first. If useful, offer opt-in updates for material license, maintenance or compatibility changes; distinguish these from noisy star-count updates. No automatic email enrollment.                                                               | 4–7 days                  |
| P2       | Mobile usability and accessibility pass   | Keeps growing filters and selectors manageable                          | Verify small-screen navigation, keyboard focus, labels, contrast and expandable optional sections on real routes; fix overflow and confusing empty states.                                                                                                       | 2–3 days                  |
| P3       | Team decisions workspace                  | Could justify recurring revenue                                         | Start with a manual prototype for shared decisions, rationale and periodic review. Build only after repeated use by several teams.                                                                                                                               | Discovery first           |

## Monetization choices

### 1. Direct sponsorship: first experiment

Sell a clearly labeled placement to a relevant developer-tool company—not approval, recommendation status, backlinks presented as editorial, or a higher trending rank.

Proposed MVP, only after explicit implementation approval:

- An `/advertise` page with the actual audience, available placement, editorial policy and a working inquiry channel. No fabricated sponsor logos, traffic claims or testimonials.
- One first-party sponsor card on relevant public guides/categories, after introductory editorial content. Separate it visually from project results; avoid popups, sticky mobile overlays and ads inside the copied prompt.
- A small campaign configuration: approved name, image, HTTPS destination, label, start/end dates and placement. Default off; automatically stop expired campaigns. No arbitrary advertiser HTML or JavaScript.
- Paid links use `rel="sponsored noopener"`; Google recommends identifying paid links with `sponsored`. [Google Search Central](https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links).
- Agreed aggregate delivery/click reporting, with bot and duplicate limitations stated. Do not sell visitor identities or guarantee customers. Reserve layout space and verify accessible labeling and page performance.
- Manual invoice/payment arrangements can support the first pilot; automated subscriptions are not a prerequisite. Business, invoicing, privacy and contract details need owner review before sale.

Validation: interview ten relevant vendors, seek two substantive price discussions and one paid four-week pilot. A €150–€300 pilot is a hypothesis to discuss, not a rate justified by today's unknown traffic. Evaluate net contribution after sales/reporting time and whether the buyer wants to renew. Stop if promised exposure cannot be delivered or servicing costs exceed the revenue.

Do not contact vendors or accept money solely on the basis of this document.

### 2. Contextual developer ads: after eligibility

EthicalAds and Carbon are more audience-aligned hypotheses than generic display ads, but acceptance and earnings are not automatic.

- EthicalAds generally asks for 50,000 monthly pageviews, with occasional exceptions. Its published estimate is around $2.50 per thousand pageviews for a predominantly European/North American audience. This is not our observed RPM. [Publisher FAQ](https://www.ethicalads.io/publishers/faq/).
- Carbon is invitation-only, evaluates audience and traffic, and imposes exclusivity. Its published typical range is $1.20–$2.30 per thousand impressions; impressions are not pageviews. Confirm current placement and contractual terms before combining any commercial inventory. [Carbon FAQ](https://www.carbonads.net/faq).
- AdSense remains an alternative, not the default first step. Relevant European ad serving involves Google's certified consent-management requirements, adding implementation and privacy work. Review the actual configuration and applicable obligations before launch. [Google consent requirements](https://support.google.com/adsense/answer/13554116?hl=en).

Illustration only: 50,000 pageviews × $2.50 / 1,000 = $125/month gross under the simplified EthicalAds estimate. This is why installing an ad script is not by itself a business model. Geographic mix, eligibility, blocking, inventory and demand matter. Do not add sponsor revenue to network estimates without confirming exclusivity permits both.

### 3. Relevant affiliate links: secondary revenue

Choose a few providers already justified by the editorial content. Verify their current program approval, attribution, payout and reversal rules before applying. Disclose the relationship next to the link and preserve non-paying alternatives. Track approved commissions, not just clicks. No default substitution toward the highest-paying vendor. The existing research has candidate programs; this roadmap does not assert any partnership exists.

### 4. Paid implementation pack: before a consumer subscription

Keep the generic prompt free. Validate a narrow paid deliverable: a working vertical slice with setup documentation, explicit supported versions, deployment guidance and bounded support. A proposed €39–€79 price is an interview hypothesis.

Gate: five explicit willingness-to-pay discussions for the same concrete deliverable, followed by separate approval before taking payment. Define licenses, maintenance duration, refund policy, support scope and payment/tax handling before checkout work. Do not promise lifetime updates or build many stack variants upfront.

### 5. Team subscription: only after recurring use exists

Potential paid value: shared architecture decisions, approved-tool policies, compatibility/source change alerts and review reports. These are proposed features, not present capabilities.

A €19–€49/team/month range is only a discovery hypothesis. Validate repeated use of a manual prototype across several weeks and a named budget owner. A one-time “which stack?” decision is insufficient justification for a monthly paywall.

## Suggested next iterations

1. **Iteration 7A — Useful product and honest measurement.** Resolve the production evidence gaps, define the product events, observe a baseline, and run five builder sessions. Deliver an audience/activation report and a prioritized usability list. Measurement starts now; meaningful traffic cannot be created by declaring the iteration complete.
2. **Iteration 7B — Decision-to-build improvements.** Implement the highest-impact guided-builder, comparison or saved-configuration improvement supported by those sessions. Publish three substantive guides and establish weekly editorial review.
3. **Iteration 7C — First commercial validation.** With owner approval, create sponsor inventory/inquiry infrastructure and conduct the vendor interviews. Launch one paid pilot only with an agreed buyer, disclosure, terms and measurable delivery. Judge renewal and contribution margin.
4. **Iteration 8 — Scale the evidence-backed winner.** Improve sponsorship renewal, apply to an eligible contextual network, or validate one implementation pack. Do not implement all revenue models simultaneously. Revisit team subscriptions only if recurring workflow demand emerges.

Suggested review cadence: weekly product/editorial review and monthly revenue review. Assign a named owner before each iteration. Track completed deliverables separately from unresolved external gates; phases are planning labels, not evidence of completion.

## Decisions needed before monetization implementation

- Monthly human pageviews, audience geography and top acquisition pages—or permission to establish a suitable measurement baseline.
- Target monthly net income, current operating costs, and realistic sales/support time.
- Whether one clearly labeled sponsor card is acceptable; which pages remain ad-free.
- Business/invoicing details and the owner of privacy, commercial terms and advertiser approval.
- Approval for the specific next action: sponsor infrastructure, advertiser outreach, network application or paid-product validation. Approval for one does not authorize all four.

**My next-build recommendation:** product measurement plus a simple sponsor inquiry/placement foundation, with inventory disabled until a real campaign is approved. Keep the catalog, comparisons and starter prompts free. No ad scripts, payment processing, outreach, tracking changes or paid features were implemented while writing this roadmap.
