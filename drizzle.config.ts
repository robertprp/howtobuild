import { defineConfig } from 'drizzle-kit'
import { loadEnvFile } from 'node:process'

try {
  loadEnvFile('.env')
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
    throw error
  }
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required to run Drizzle commands')
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  strict: true,
  verbose: true,
})
