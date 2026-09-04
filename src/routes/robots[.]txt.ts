import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: () => {
        const origin = (
          process.env.SITE_URL ?? 'https://howtobuild.dev'
        ).replace(/\/$/, '')
        const body = [
          'User-agent: *',
          'Allow: /',
          'Disallow: /admin',
          'Disallow: /preview',
          'Disallow: /sign-in',
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
