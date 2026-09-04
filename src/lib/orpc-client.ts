import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import type { RouterClient } from '@orpc/server'
import { createTanstackQueryUtils } from '@orpc/tanstack-query'

import type { AppRouter } from '../orpc/router'

const link = new RPCLink({
  url: () => new URL('/api/rpc', window.location.origin),
  fetch(request, init) {
    return globalThis.fetch(request, { ...init, credentials: 'same-origin' })
  },
})

export const orpcClient: RouterClient<AppRouter> = createORPCClient(link)
export const orpc = createTanstackQueryUtils(orpcClient)
