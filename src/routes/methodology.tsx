import { seoHead } from '../lib/seo'
import { createFileRoute } from '@tanstack/react-router'
import { ContentPage } from '../components/content-page'

export const Route = createFileRoute('/methodology')({
  head: () =>
    seoHead({
      title: 'How we review tools and measure GitHub growth',
      description:
        'Understand our tech stack recommendations, source checks, pricing labels, and observed GitHub star-growth windows.',
      path: '/methodology',
    }),
  component: Methodology,
})

function Methodology() {
  return (
    <ContentPage
      eyebrow="How the guide works"
      title="Methodology"
      lede="Public ecosystem signals help us notice change. Sourced editorial judgment determines what is useful enough to publish."
    >
      <section>
        <h2>Trending is measured momentum</h2>
        <p>
          We store aggregate GitHub observations and compare eligible snapshots
          over approximately 7, 30, and 49 days. The trending page ranks catalog
          projects by net stars gained in the selected period, not lifetime
          totals. We show the actual observation dates: the seven-week baseline
          must be within three days of 49 days. This is not an index of all
          GitHub repositories or a count of every individual starring event. New
          projects are labeled as early signals; incomplete windows are never
          extrapolated. Other discovery surfaces may use our separate,
          category-normalized momentum score, which also considers relative
          growth and recent repository activity.
        </p>
      </section>
      <section>
        <h2>Recommended is editorial</h2>
        <p>
          A recommendation is a separate human decision. It reflects usefulness,
          technical approach, developer experience, maintenance, and the quality
          of the tradeoff—not merely popularity. A project can be trending,
          recommended, both, or neither.
        </p>
      </section>
      <section>
        <h2>Guardrails</h2>
        <p>
          Stale, private, archived, anomalous, or manually excluded repositories
          cannot automatically take a ranking slot. We publish the evidence
          window and confidence instead of presenting an unexplained score. The
          precise weighting remains internal to reduce gaming.
        </p>
      </section>
      <section>
        <h2>Pricing and open source</h2>
        <p>
          Open source describes licensing, not the price of a hosted service.
          Pricing labels summarize a meaningful early production use case and
          link to the source checked by the editorial team. “Unknown” is
          preferable to a guess.
        </p>
      </section>
      <section>
        <h2>Stacks and corrections</h2>
        <p>
          Stacks are authored around a target user and responsibility map. Each
          choice needs a rationale, cost and ownership context, alternatives
          where they materially differ, explicit tradeoffs, and current sources.
          If a fact is wrong or stale, use the corrections page.
        </p>
      </section>
    </ContentPage>
  )
}
