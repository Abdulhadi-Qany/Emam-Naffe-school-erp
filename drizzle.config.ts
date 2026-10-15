import { existsSync, readFileSync } from 'node:fs'
import { defineConfig } from 'drizzle-kit'

// Load DATABASE_URL from .env.local / .env when not already set in the environment
function loadEnv() {
  if (process.env.DATABASE_URL) return
  for (const file of ['.env.local', '.env']) {
    if (!existsSync(file)) continue
    for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
      if (!match) continue
      const [, key, rawValue] = match
      if (rawValue === undefined || process.env[key] !== undefined) continue
      process.env[key] = rawValue.replace(/^["']|["']$/g, '')
    }
  }
}

loadEnv()

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/ebps_erp',
  },
  strict: false,
  verbose: true,
})
