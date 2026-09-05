// One production identity for canonicals, social previews, robots, and sitemap.
// Local/auth origins (SITE_URL/BETTER_AUTH_URL) must not leak into search URLs.
export const SITE_ORIGIN = 'https://howtobuild.dev'
export const SITE_NAME = 'HowToBuild.dev'
export const SITE_DESCRIPTION =
  'Choose a tech stack and learn how to build your app. Compare frameworks, authentication, databases, costs, and tradeoffs, then copy a starter prompt.'
export const SITE_INDEXABLE =
  import.meta.env.PROD && import.meta.env.VITE_SITE_INDEXABLE !== 'false'

export type Breadcrumb = { name: string; path: string }
export const absoluteUrl = (path: string) => new URL(path, SITE_ORIGIN).href

export function jsonLd(value: unknown) {
  // Editorial strings must never terminate an inline script element.
  return JSON.stringify(value)
    .replaceAll('<', '\\u003c')
    .replaceAll('\u2028', '\\u2028')
    .replaceAll('\u2029', '\\u2029')
}

export function seoHead({
  title,
  description,
  path,
  noindex = false,
  type = 'WebPage',
  breadcrumbs = [],
  schemas = [],
}: {
  title: string
  description: string
  path: string
  noindex?: boolean
  type?: 'WebPage' | 'CollectionPage'
  breadcrumbs?: Breadcrumb[]
  schemas?: Record<string, unknown>[]
}) {
  const url = absoluteUrl(path)
  const fullTitle = `${title} — ${SITE_NAME}`
  const image = absoluteUrl('/assets/social-card.png')
  return {
    meta: [
      { title: fullTitle },
      { name: 'description', content: description },
      {
        name: 'robots',
        content:
          noindex || !SITE_INDEXABLE
            ? 'noindex, follow'
            : 'index, follow, max-image-preview:large',
      },
      { property: 'og:site_name', content: SITE_NAME },
      { property: 'og:type', content: 'website' },
      { property: 'og:locale', content: 'en_US' },
      { property: 'og:title', content: fullTitle },
      { property: 'og:description', content: description },
      { property: 'og:url', content: url },
      { property: 'og:image', content: image },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      {
        property: 'og:image:alt',
        content: 'HowToBuild.dev — Choose your stack. Start your build.',
      },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: fullTitle },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: image },
      {
        name: 'twitter:image:alt',
        content: 'HowToBuild.dev — Choose your stack. Start your build.',
      },
    ],
    links: [{ rel: 'canonical', href: url }],
    scripts: [
      {
        type: 'application/ld+json',
        children: jsonLd({
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': type,
              '@id': `${url}#page`,
              url,
              name: fullTitle,
              description,
              inLanguage: 'en',
              isPartOf: { '@id': `${SITE_ORIGIN}/#website` },
            },
            ...(breadcrumbs.length > 1
              ? [
                  {
                    '@type': 'BreadcrumbList',
                    itemListElement: breadcrumbs.map((item, index) => ({
                      '@type': 'ListItem',
                      position: index + 1,
                      name: item.name,
                      item: absoluteUrl(item.path),
                    })),
                  },
                ]
              : []),
            ...schemas,
          ],
        }),
      },
    ],
  }
}

export function itemList(items: { name: string; path: string }[]) {
  return {
    '@type': 'ItemList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      url: absoluteUrl(item.path),
    })),
  }
}
