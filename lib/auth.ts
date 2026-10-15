import { betterAuth } from 'better-auth'
import { drizzle } from 'drizzle-orm/node-postgres'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db as appDb } from '@/lib/db'

const origin = (value?: string) => value ? (value.startsWith('http') ? value : `https://${value}`) : undefined
const trustedOrigins = [
  'http://localhost:3000',
  origin(process.env.V0_RUNTIME_URL), origin(process.env.V0_DEV_APP_URL), origin(process.env.V0_BUILD_URL), origin(process.env.V0_SANDBOX_URL),
  origin(process.env.VERCEL_URL), origin(process.env.VERCEL_PROJECT_PRODUCTION_URL),
].filter(Boolean) as string[]

export const auth = betterAuth({
  database: drizzleAdapter(appDb, { provider: 'pg', usePlural: false }),
  baseURL: origin(process.env.BETTER_AUTH_URL) ?? origin(process.env.VERCEL_PROJECT_PRODUCTION_URL) ?? origin(process.env.VERCEL_URL) ?? origin(process.env.V0_RUNTIME_URL),
  trustedOrigins,
  emailAndPassword: { enabled: true },
  ...(process.env.NODE_ENV === 'development'
    ? { advanced: { defaultCookieAttributes: { sameSite: 'lax' as const, secure: false } } }
    : {}),
})
