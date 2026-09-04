import { describe, expect, it } from 'vitest'

import { toSupabasePoolerUrl } from '../src/db/connection-url'

describe('Supabase database connection URLs', () => {
  const directUrl =
    'postgresql://postgres:secret@db.exampleproject.supabase.co:5432/postgres'
  const poolerHost = 'aws-1-eu-west-1.pooler.supabase.com'

  it('converts a direct connection to an IPv4-compatible session pooler', () => {
    expect(toSupabasePoolerUrl(directUrl, poolerHost)).toBe(
      'postgresql://postgres.exampleproject:secret@aws-1-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require&uselibpqcompat=true',
    )
  })

  it('supports the transaction pooler used by serverless deployments', () => {
    expect(toSupabasePoolerUrl(directUrl, poolerHost, 'transaction')).toContain(
      ':6543/postgres?sslmode=require&uselibpqcompat=true',
    )
  })

  it('rejects a non-Supabase pooler host', () => {
    expect(() =>
      toSupabasePoolerUrl(directUrl, 'database.example.com'),
    ).toThrow('The pooler host must end in .pooler.supabase.com')
  })
})
