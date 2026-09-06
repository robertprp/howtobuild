import type { StarterChoice } from './starter'
import { typescriptAddonGroups, typescriptStacks } from './typescript-options'

// Reviewed 2026-09-06. Hosted APIs work behind the selected server framework;
// these are optional product capabilities, not mandatory runtime dependencies.
export const addonGroups: Array<{
  responsibility: string
  options: StarterChoice[]
}> = [
  {
    responsibility: 'Identity verification (KYC)',
    options: [
      [
        'persona',
        'Persona',
        'Use a hosted inquiry flow. Confirm supported countries, documents, retention, and contract terms for the actual use case.',
        'https://docs.withpersona.com/hosted-flow',
      ],
      [
        'didit',
        'Didit',
        'Create a hosted verification session on the server using a configured workflow; verify signed webhook updates. Choose KYC, KYB, and AML checks deliberately, not interchangeably.',
        'https://docs.didit.me/getting-started/quick-start',
      ],
      [
        'stripe-identity',
        'Stripe Identity',
        'Create VerificationSessions server-side and handle asynchronous outcomes. Check business and document eligibility; document verification alone is not a complete compliance program.',
        'https://docs.stripe.com/identity/verification-sessions',
      ],
    ].map(([id, name, rationale, sourceUrl]) => ({
      id,
      name,
      rationale,
      sourceUrl,
      responsibility: 'Identity verification (KYC)',
      cost: 'Hosted paid service; verify current coverage, rates, and account eligibility.',
    })),
  },
  {
    responsibility: 'Billing',
    options: [
      {
        id: 'polar',
        name: 'Polar',
        responsibility: 'Billing',
        rationale:
          'Evaluate Polar as a hosted merchant of record for eligible digital products. Use the adapter for the selected framework, server-created checkout and verified webhook events for entitlements. Confirm account/product eligibility, fees and responsibilities before production.',
        cost: 'Commercial hosted service; fees and eligibility depend on current terms.',
        sourceUrl:
          'https://polar.sh/docs/integrate/sdk/adapters/tanstack-start',
      },
      {
        id: 'stripe-billing',
        name: 'Stripe Billing',
        responsibility: 'Billing',
        rationale:
          'Use hosted checkout and server-verified subscription events for entitlements. Handle cancellation, payment failure, duplicate events, and customer self-service.',
        cost: 'Payment processing and billing fees; check regional pricing and tax responsibilities.',
        sourceUrl: 'https://docs.stripe.com/billing/subscriptions/overview',
      },
    ],
  },
  {
    responsibility: 'Transactional email',
    options: [
      {
        id: 'resend',
        name: 'Resend',
        responsibility: 'Transactional email',
        rationale:
          'Send from the backend with a verified domain. Reuse accessible HTML templates and handle delivery failures without logging recipient content.',
        cost: 'Hosted service with usage limits and paid plans.',
        sourceUrl: 'https://resend.com/docs/send-with-nodejs',
      },
    ],
  },
  {
    responsibility: 'File storage',
    options: [
      {
        id: 'cloudflare-r2',
        name: 'Cloudflare R2',
        responsibility: 'File storage',
        rationale:
          'Keep buckets private. Issue short-lived S3-compatible presigned URLs after authorization; enforce file size/type rules and a deletion lifecycle.',
        cost: 'Storage and operation charges; verify current allowances.',
        sourceUrl:
          'https://developers.cloudflare.com/r2/api/s3/presigned-urls/',
      },
    ],
  },
  {
    responsibility: 'Background jobs',
    options: [
      {
        id: 'inngest',
        name: 'Inngest',
        responsibility: 'Background jobs',
        rationale:
          'Use durable event-driven functions for retries and scheduled work. Verify the adapter for the selected server framework and make side effects idempotent.',
        cost: 'Managed usage-based plans; evaluate deployment and execution limits.',
        sourceUrl: 'https://www.inngest.com/docs',
      },
      {
        id: 'trigger-dev',
        name: 'Trigger.dev',
        responsibility: 'Background jobs',
        rationale:
          'Use TypeScript tasks for asynchronous or long-running work. Tasks have a separate worker deployment; configure retries, concurrency, and idempotency.',
        cost: 'Managed compute/usage charges; self-hosting has operating costs.',
        sourceUrl: 'https://trigger.dev/docs/quick-start',
      },
    ],
  },
  {
    responsibility: 'Product analytics',
    options: [
      {
        id: 'posthog',
        name: 'PostHog',
        responsibility: 'Product analytics',
        rationale:
          'Track a small explicit event schema. Disable automatic capture and session replay initially; exclude identity documents, personal content, and secrets. Review consent and hosting requirements.',
        cost: 'Usage-based hosted plans; verify product-specific limits.',
        sourceUrl: 'https://posthog.com/docs/libraries/next-js',
      },
    ],
  },
]

export function optionalStarterGroups(stackSlug: string, chosen: Set<string>) {
  if (!typescriptStacks.has(stackSlug)) return []
  return [...addonGroups, ...typescriptAddonGroups(chosen)].map((group) => ({
    responsibility: group.responsibility,
    options: [
      {
        id: `none:${group.responsibility}`,
        name: 'Not needed',
        responsibility: group.responsibility,
        rationale:
          'Optional — add only when your product needs this capability.',
        cost: '',
        sourceUrl: '',
        omitted: true,
      },
      ...group.options,
    ],
  }))
}
