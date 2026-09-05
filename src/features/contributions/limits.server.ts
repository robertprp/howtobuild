import { createHmac } from 'node:crypto'
import { isIP } from 'node:net'
import { sql } from 'drizzle-orm'
import { ORPCError } from '@orpc/server'
import { getDb } from '../../db/client.server'
import { contributionRateLimits } from '../../db/schema'

export const clientIpHeader =
  process.env.TRUSTED_CLIENT_IP_HEADER || 'x-forwarded-for'

export function hashIdentity(value: string) {
  const secret =
    process.env.CONTRIBUTION_HASH_SECRET || process.env.BETTER_AUTH_SECRET
  if (!secret && process.env.NODE_ENV === 'production')
    throw new Error('A contribution hash secret is required')
  return createHmac('sha256', secret || 'local-contribution-secret')
    .update(value)
    .digest('hex')
}

export async function consumeQuota(
  key: string,
  action: string,
  max: number,
  windowSeconds = 3600,
) {
  const now = Date.now()
  const duration = windowSeconds * 1000
  const start = Math.floor(now / duration) * duration
  const [row] = await getDb()
    .insert(contributionRateLimits)
    .values({
      identityHash: hashIdentity(key),
      action,
      windowStartedAt: new Date(start),
    })
    .onConflictDoUpdate({
      target: [
        contributionRateLimits.identityHash,
        contributionRateLimits.action,
        contributionRateLimits.windowStartedAt,
      ],
      set: {
        count: sql`least(${contributionRateLimits.count} + 1, ${max + 1})`,
      },
    })
    .returning({ count: contributionRateLimits.count })
  return {
    allowed: row.count <= max,
    retryAfter:
      row.count <= max ? null : Math.ceil((start + duration - now) / 1000),
  }
}

export async function limitContribution(
  request: Request,
  userId: string,
  action: string,
  max: number,
  ipMax: number,
) {
  const supplied =
    request.headers.get(clientIpHeader)?.split(',')[0]?.trim() ?? ''
  const ip = isIP(supplied) ? supplied : 'unknown'
  const results = await Promise.all([
    consumeQuota(`account:${userId}`, action, max),
    consumeQuota(`ip:${ip}`, action, ipMax),
  ])
  if (results.some((result) => !result.allowed))
    throw new ORPCError('TOO_MANY_REQUESTS', {
      message: 'Too many attempts. Please try again in an hour.',
    })
}
