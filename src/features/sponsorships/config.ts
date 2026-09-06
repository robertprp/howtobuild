import { z } from 'zod'

const campaignSchema = z
  .object({
    enabled: z.literal(true),
    name: z.string().trim().min(1).max(80),
    message: z.string().trim().min(1).max(180),
    destination: z
      .string()
      .url()
      .refine((value) => {
        const url = new URL(value)
        return url.protocol === 'https:' && !url.username && !url.password
      }),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
    placements: z
      .array(
        z
          .string()
          .regex(
            /^\/(guides\/[a-z0-9-]+|frontend|backend|mobile|devops|observability|ai-tools)$/,
          ),
      )
      .min(1),
  })
  .strict()
  .refine(
    (campaign) => Date.parse(campaign.endsAt) > Date.parse(campaign.startsAt),
  )

// Approved public creative only. Empty means no placements, requests or gaps.
// Keep secrets and commercial contracts out of this client-visible file.
const approvedCampaigns: unknown[] = []

export function hasSponsorInventory(path: string) {
  return approvedCampaigns.some((candidate) => {
    const parsed = campaignSchema.safeParse(candidate)
    return parsed.success && parsed.data.placements.includes(path)
  })
}

export function activeSponsor(path: string, now = Date.now()) {
  for (const candidate of approvedCampaigns) {
    const result = campaignSchema.safeParse(candidate)
    if (!result.success) continue
    const campaign = result.data
    if (
      campaign.placements.includes(path) &&
      Date.parse(campaign.startsAt) <= now &&
      now < Date.parse(campaign.endsAt)
    )
      return campaign
  }
  return null
}

const email = z
  .string()
  .email()
  .safeParse(import.meta.env.VITE_SPONSOR_CONTACT_EMAIL)
export const sponsorContact = email.success ? email.data : null
