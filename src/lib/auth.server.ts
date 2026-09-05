import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { emailOTP } from 'better-auth/plugins'
import { tanstackStartCookies } from 'better-auth/tanstack-start'

import { getDb } from '../db/client.server'
import * as schema from '../db/schema'
import { sendOtpEmail } from './email.server'
import {
  clientIpHeader,
  consumeQuota,
} from '../features/contributions/limits.server'

const socialProviders = {
  ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
    ? {
        github: {
          clientId: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
        },
      }
    : {}),
  ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
      }
    : {}),
}

export const auth = betterAuth({
  appName: 'HowToBuild.dev',
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
  secret:
    process.env.BETTER_AUTH_SECRET ??
    'phase-zero-local-only-secret-never-use-in-production',
  database: drizzleAdapter(getDb(), {
    provider: 'pg',
    schema,
  }),
  socialProviders,
  rateLimit: {
    enabled: true,
    window: 60,
    max: 10,
    customStorage: {
      consume: (key, rule) =>
        consumeQuota(`auth:${key}`, 'authentication', rule.max, rule.window),
    },
    customRules: {
      '/email-otp/send-verification-otp': { window: 60, max: 3 },
      '/sign-in/email-otp': { window: 60, max: 5 },
    },
  },
  advanced: {
    ipAddress: { ipAddressHeaders: [clientIpHeader] },
    useSecureCookies: process.env.NODE_ENV === 'production',
  },
  plugins: [
    emailOTP({
      expiresIn: 600,
      allowedAttempts: 5,
      storeOTP: 'hashed',
      async sendVerificationOTP(payload) {
        const quota = await consumeQuota(
          `email:${payload.email.trim().toLowerCase()}`,
          'otp-email',
          5,
        )
        if (!quota.allowed)
          throw new Error('Please wait before requesting another code.')
        await sendOtpEmail(payload)
      },
    }),
    tanstackStartCookies(),
  ],
})
