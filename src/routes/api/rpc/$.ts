import { RPCHandler } from '@orpc/server/fetch'
import { onError } from '@orpc/server'
import { createFileRoute } from '@tanstack/react-router'

import { appRouter } from '../../../orpc/router'

const handler = new RPCHandler(appRouter, {
  interceptors: [
    onError((error) => console.error('oRPC request failed', error)),
  ],
})

export const Route = createFileRoute('/api/rpc/$')({
  server: {
    handlers: {
      ANY: async ({ request }) => {
        const { response } = await handler.handle(request, {
          prefix: '/api/rpc',
          context: { request },
        })

        return response ?? new Response('Not Found', { status: 404 })
      },
    },
  },
})
