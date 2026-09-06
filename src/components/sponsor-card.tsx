import { useEffect, useState } from 'react'
import {
  activeSponsor,
  hasSponsorInventory,
} from '../features/sponsorships/config'

export function SponsorCard({
  path,
  checkedAt,
}: {
  path: string
  checkedAt: number
}) {
  // The serialized loader timestamp keeps SSR and hydration identical.
  const [now, setNow] = useState(checkedAt)
  useEffect(() => {
    if (!hasSponsorInventory(path)) return
    setNow(Date.now())
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [path])
  const campaign = activeSponsor(path, now)
  if (!campaign) return null
  return (
    <aside className="sponsor-card" aria-label="Sponsored placement">
      <p className="eyebrow">Sponsored · Paid placement</p>
      <h2>{campaign.name}</h2>
      <p>{campaign.message}</p>
      <a
        href={campaign.destination}
        rel="sponsored noopener noreferrer"
        target="_blank"
        data-sponsor="true"
      >
        Visit sponsor ↗
      </a>
      <small>
        Paid exposure, not an editorial recommendation.{' '}
        <a href="/advertise">Our policy</a>
      </small>
    </aside>
  )
}
