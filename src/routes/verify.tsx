import { createFileRoute, redirect } from '@tanstack/react-router'
import { safeReturnPath } from '../lib/return-path'

export const Route = createFileRoute('/verify')({
  validateSearch: (search: Record<string, unknown>) => ({
    next: safeReturnPath(search.next),
  }),
  beforeLoad: ({ search }) => {
    throw redirect({
      to: '/sign-in',
      search: { next: search.next, error: undefined },
    })
  },
})
