# Search discovery and builder-directory design

## What changed

The homepage follows the visual direction of the supplied Lenny's Jobs reference: a peach hero and header, bold sans-serif typography, a rounded search control, left-hand filters, and bordered white result cards. The branding, text, tool data, and artwork remain HowToBuild's. Search, category filters, ownership preferences, sort order, and progressive loading operate on the published catalog. The homepage initially renders twelve tool cards on the server; every project remains discoverable through linked category pages and the sitemap.

The homepage, stack directory, stack/project pages, category/ecosystem pages, guides, trending, and informational pages share a metadata helper. It supplies distinct titles and descriptions, canonical URLs, Open Graph/Twitter previews, and safely serialized JSON-LD. WebSite/Organization identity appears on the homepage; collection pages describe their lists; guides include TechArticle and breadcrumb data. No ratings, user counts, prices, awards, or review claims are fabricated to obtain rich results.

New public guides address actual product decisions:

| Search intent                                              | Destination                               |
| ---------------------------------------------------------- | ----------------------------------------- |
| What tech stack should I use? / how to choose a tech stack | `/guides/how-to-choose-a-tech-stack`      |
| How to build a SaaS app / SaaS tech stack                  | `/guides/how-to-build-a-saas-app`         |
| Better Auth vs Clerk / shadcn vs Mantine / React stack     | `/guides/react-auth-and-styling-options`  |
| Technology stacks and starter prompts                      | `/stacks` and the individual stack guides |
| Framework uses, costs, ownership, and tradeoffs            | The relevant `/projects/:slug` page       |

These are target intents, not measured search volumes or guaranteed ranking opportunities. Guides link to official sources, related guides, and the working stack starter. Review and expand them with real implementation examples and clearly attributed editorial experience over time.

## Indexing rules

- `https://howtobuild.dev` is the single production identity in `src/lib/seo.ts`. Canonicals, structured data, robots, and sitemap use it consistently. Local `SITE_URL` and auth callbacks do not change the canonical domain.
- Development pages are `noindex`. Set `VITE_SITE_INDEXABLE=false` before building any staging deployment. Vercel preview builds force this flag false automatically. Protect sensitive previews with hosting authentication as well: noindex is not access control.
- Public production pages can be indexed. Private/account/auth pages retain their existing noindex and server authorization. Search results and category-filtered trending variants are noindex; their useful content has permanent public destinations.
- Ecosystem pages with fewer than three published projects remain browseable but noindex and outside the sitemap. This is our conservative editorial threshold for thin inventories, not a Google-mandated project count.
- Default search parameters are stripped so `/trending` and `/search` do not redirect solely to append `period=week` or an empty `q`.
- The sitemap lists published projects/stacks, eligible ecosystems, guides, and public informational pages. Content modification dates come from stored or authored dates, not the request clock.
- Robots blocks API/server-function paths but leaves HTML pages crawlable so search engines can observe their noindex directives.

## Favicon and sharing assets

The original H mark is adapted to a rounded dark icon with the new orange accent. Assets include a 96px PNG favicon, SVG, ICO fallback, Apple touch icon, 192/512px manifest icons, and a 1200×630 PNG social card. All are first-party code-native artwork, not copied from the reference site.

Regenerate the raster assets after changing their SVG sources:

```sh
pnpm exec tsx scripts/generate-brand-assets.ts
```

No new dependency or database migration is required for this SEO/design update.

## Release checklist

1. Run `pnpm typecheck`, `pnpm exec eslint`, `pnpm test`, and `pnpm build`. Do not initialize a database or add tests. Use the already configured database for public-page checks.
2. Confirm the production hostname serves HTTPS and redirects alternate hosts consistently through the hosting provider. Check it is not behind preview authentication and was not built with `VITE_SITE_INDEXABLE=false`.
3. Inspect rendered HTML for the homepage, a guide, stack, project, category, and ecosystem: one meaningful title, one canonical, appropriate robots directive, readable content, and parseable JSON-LD. Check unknown guide/project URLs return 404 rather than a successful empty page.
4. Check `/robots.txt`, `/sitemap.xml`, `/favicon-96.png`, `/favicon.ico`, `/apple-touch-icon.png`, `/site.webmanifest`, and `/assets/social-card.png` return successful responses with suitable content types. Verify sitemap URLs resolve to the intended public pages.
5. Verify a Google Search Console property using DNS, or set the public `VITE_GOOGLE_SITE_VERIFICATION` token before building. This requires the owner's Search Console/domain access; implementation did not create an account or submit URLs on the owner's behalf.
6. Submit `https://howtobuild.dev/sitemap.xml` in Search Console. Use URL Inspection on the homepage, stack directory, and new guides; request indexing after successful live checks. Inspect breadcrumb/article data with Google's Rich Results Test. Eligibility does not guarantee a rich result.
7. Record a baseline for impressions, clicks, queries, and indexed canonical pages. Revisit after Google has recrawled. Improve pages that earn relevant impressions but do not answer the query well; do not create hundreds of near-identical keyword pages.
8. Check desktop and mobile search/filter behavior, clear filters, show more, guide navigation, stack selection, copy/download, keyboard focus, and reduced-motion behavior. Monitor real-user Core Web Vitals after deployment; a successful build is not a performance certification.

## Research used

- [Google SEO starter guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide): descriptive content, headings, links, and metadata.
- [Helpful, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content): useful decision guides instead of keyword stuffing or unsupported experience claims.
- [Canonical URL consolidation](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls): consistent public URLs and sitemap signals.
- [Noindex behavior](https://developers.google.com/search/docs/crawling-indexing/block-indexing): crawlers must be able to retrieve a page to see noindex.
- [Site names](https://developers.google.com/search/docs/appearance/site-names) and [breadcrumbs](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb): accurate site identity and navigation markup.
- [Favicon guidance](https://developers.google.com/search/docs/appearance/favicon-in-search): stable, square, crawlable brand icons. The provided PNG is 96×96; display in Search is not guaranteed.
- [TanStack search defaults](https://tanstack.com/router/latest/docs/api/router/stripSearchParamsFunction): removing default query values from canonical navigation.

Google ultimately decides which pages to index and how to rank them. This implementation improves discoverability and usefulness; it cannot guarantee broad or first-page placement.
