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
        const origin = request.headers.get('origin')
        const expectedOrigin = new URL(
          process.env.BETTER_AUTH_URL || request.url,
        ).origin
        if (
          request.headers.get('sec-fetch-site') === 'cross-site' ||
          (origin && origin !== expectedOrigin)
        ) {
          return new Response('Forbidden', { status: 403 })
        }
        const { response } = await handler.handle(request, {
          prefix: '/api/rpc',
          context: { request },
        })

        if (response) {
          response.headers.set('Cache-Control', 'private, no-store')
          response.headers.set('Vary', 'Cookie, Authorization')
        }
        return response ?? new Response('Not Found', { status: 404 })
      },
    },
  },
})
