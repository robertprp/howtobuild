import { createFileRoute } from '@tanstack/react-router'

import {
  listCategories,
  listPublishedProjects,
} from '../features/editorial/store.server'

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async () => {
        const origin = (
          process.env.SITE_URL ?? 'https://howtobuild.dev'
        ).replace(/\/$/, '')
        const [allCategories, allProjects] = await Promise.all([
          listCategories(),
          listPublishedProjects(),
        ])
        const urls = [
          {
            path: '/',
            lastmod: allProjects
              .map((project) => project.updatedAt)
              .sort()
              .at(-1),
          },
          ...allCategories.map((category) => ({
            path: `/${category.slug}`,
            lastmod: undefined,
          })),
          { path: '/trending', lastmod: undefined },
          { path: '/trending?period=month', lastmod: undefined },
          ...Array.from(
            new Map(
              allProjects.flatMap((project) =>
                project.facets.map((facet) => [
                  `${project.category.slug}/${facet.slug}`,
                  {
                    path: `/${project.category.slug}/${facet.slug}`,
                    lastmod: undefined,
                  },
                ]),
              ),
            ).values(),
          ),
          ...allProjects.map((project) => ({
            path: `/projects/${project.slug}`,
            lastmod: project.updatedAt.slice(0, 10),
          })),
        ]
        const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(({ path, lastmod }) => `  <url><loc>${escapeXml(`${origin}${path}`)}</loc>${lastmod ? `<lastmod>${escapeXml(lastmod.slice(0, 10))}</lastmod>` : ''}</url>`).join('\n')}\n</urlset>\n`
        return new Response(body, {
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=0, must-revalidate',
          },
        })
      },
    },
  },
})
