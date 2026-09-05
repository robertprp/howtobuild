import { ArrowUpRight, CheckCircle2, Star } from 'lucide-react'
import type { PublicProject } from '../features/editorial/model'
import { ProjectMark } from './project-views'

export function ProjectCard({ project }: { project: PublicProject }) {
  const momentum = project.momentum
  const usableMomentum =
    momentum &&
    !['stale', 'disabled'].includes(momentum.health) &&
    !momentum.anomaly
  return (
    <article className="directory-card">
      <div className="directory-card-main">
        <ProjectMark project={project} />
        <div className="directory-card-copy">
          <h3>
            <a href={`/projects/${project.slug}`}>
              {project.name}
              <ArrowUpRight size={17} aria-hidden="true" />
            </a>
          </h3>
          <p>{project.shortDescription}</p>
          <div className="directory-category">
            {project.category.name} · {project.projectType}
          </div>
          <div className="directory-tags">
            {project.facets.slice(0, 4).map((facet) => (
              <a
                href={`/${project.category.slug}/${facet.slug}`}
                key={facet.id}
              >
                {facet.name}
              </a>
            ))}
            {project.openSource ? <span>Open source</span> : null}
            {project.selfHostable ? <span>Self-hostable</span> : null}
          </div>
        </div>
        <span className="directory-price">{project.pricingLabel}</span>
      </div>
      <footer>
        <span>
          {project.recommended ? (
            <>
              <CheckCircle2 size={15} aria-hidden="true" /> Editorial pick
            </>
          ) : (
            'Reviewed project'
          )}
        </span>
        {usableMomentum ? (
          <span>
            <Star size={14} aria-hidden="true" />
            {new Intl.NumberFormat('en-US', { notation: 'compact' }).format(
              momentum.stars,
            )}{' '}
            stars
            {momentum.absolute7d !== null
              ? ` · +${new Intl.NumberFormat('en-US').format(momentum.absolute7d)} / 7d`
              : ''}
          </span>
        ) : (
          <span>Sources, pricing & tradeoffs</span>
        )}
        <a href={`/projects/${project.slug}`}>
          View project <ArrowUpRight size={14} aria-hidden="true" />
        </a>
      </footer>
    </article>
  )
}
