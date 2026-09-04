import type { PublicProject } from '../features/editorial/model'

export function ProjectMark({ project }: { project: PublicProject }) {
  return (
    <span
      className="project-mark"
      style={
        { '--category-accent': project.category.accent } as React.CSSProperties
      }
      aria-hidden="true"
    >
      {project.name.slice(0, 2).toUpperCase()}
    </span>
  )
}

export function ProjectMeta({ project }: { project: PublicProject }) {
  return (
    <span className="project-meta">
      <span>{project.category.name}</span>
      <span>{project.projectType}</span>
      <strong>{project.pricingLabel}</strong>
    </span>
  )
}

export function TrendingRow({
  project,
  rank,
  period = 'week',
}: {
  project: PublicProject
  rank: number
  period?: 'week' | 'month'
}) {
  return (
    <a className="trending-row" href={`/projects/${project.slug}`}>
      <span className="rank">{String(rank).padStart(2, '0')}</span>
      <ProjectMark project={project} />
      <span className="row-copy">
        <strong>{project.name}</strong>
        <span>{project.shortDescription}</span>
      </span>
      <ProjectMeta project={project} />
      <MomentumSummary project={project} period={period} />
    </a>
  )
}

function compact(value: number) {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

export function MomentumSummary({
  project,
  period = 'week',
}: {
  project: PublicProject
  period?: 'week' | 'month'
}) {
  const momentum = project.momentum
  if (!momentum)
    return <span className="metric-unavailable">History starts after sync</span>
  const delta = period === 'week' ? momentum.absolute7d : momentum.absolute30d
  if (delta === null)
    return (
      <span className="metric-unavailable">
        Early signal · ★ {compact(momentum.stars)}
      </span>
    )
  return (
    <span className="momentum-summary">
      <strong>+{compact(delta)}</strong>
      <span>
        {period === 'week' ? '7 days' : '30 days'} · ★ {compact(momentum.stars)}
      </span>
    </span>
  )
}

export function EditorialFeature({ project }: { project: PublicProject }) {
  return (
    <article
      className="editorial-feature"
      style={
        { '--category-accent': project.category.accent } as React.CSSProperties
      }
    >
      <div className="feature-art" aria-hidden="true">
        {project.name}
      </div>
      <div>
        <p className="eyebrow">Why it is here</p>
        <h3>
          <a href={`/projects/${project.slug}`}>{project.name}</a>
        </h3>
        <p>{project.whyInteresting}</p>
        <p className="tradeoff">
          <strong>One tradeoff:</strong> {project.notIdealFor[0]}
        </p>
      </div>
    </article>
  )
}

export function StackItemExample({ project }: { project: PublicProject }) {
  return (
    <article className="stack-item">
      <p className="eyebrow">Application foundation</p>
      <h3>{project.name}</h3>
      <p>{project.bestFor[0]}</p>
      <a href={`/projects/${project.slug}`}>Read the rationale →</a>
    </article>
  )
}

export function SearchResultExample({ project }: { project: PublicProject }) {
  return (
    <a className="search-result" href={`/projects/${project.slug}`}>
      <span className="eyebrow">Project · matched “{project.projectType}”</span>
      <strong>{project.name}</strong>
      <span>{project.shortDescription}</span>
      <span className="canonical">/projects/{project.slug}</span>
    </a>
  )
}
