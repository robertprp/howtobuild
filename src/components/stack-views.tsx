import type { PublicStack } from '../features/editorial/model'

export function StackCard({ stack }: { stack: PublicStack }) {
  const openCount = stack.items.filter((item) => item.project.openSource).length
  return (
    <a className="stack-card" href={`/stacks/${stack.slug}`}>
      <span className="eyebrow">{stack.earlyStageFit}</span>
      <h2>{stack.name}</h2>
      <p>{stack.summary}</p>
      <span className="stack-card-meta">
        {stack.items.length} responsibilities · {openCount} open-source choices
      </span>
      <strong>Explore the stack →</strong>
    </a>
  )
}
