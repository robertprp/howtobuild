import { createFileRoute } from '@tanstack/react-router'
import { SITE_ORIGIN } from '../lib/seo'

export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: () => {
        const origin = SITE_ORIGIN
        const body = [
          'User-agent: *',
          'Allow: /',
          // HTML noindex must remain crawlable; robots is not access control.
          'Disallow: /api/',
          'Disallow: /_serverFn/',
          `Sitemap: ${origin}/sitemap.xml`,
          '',
        ].join('\n')
        return new Response(body, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, max-age=3600',
          },
        })
      },
    },
  },
})
