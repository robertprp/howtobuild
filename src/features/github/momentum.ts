export const MOMENTUM_ALGORITHM_VERSION = 'v1.0.0'

const DAY = 86_400_000

export type MomentumSnapshot = {
  id: string
  observedAt: Date
  stars: number
  pushedAt: Date | null
  latestReleaseAt: Date | null
}

export type MomentumEvidence = {
  currentSnapshotId: string
  weeklySnapshotId: string | null
  monthlySnapshotId: string | null
  stars: number
  absolute7d: number | null
  absolute30d: number | null
  relative7d: number | null
  relative30d: number | null
  activityFactor: number
  confidence: 'early' | 'weekly' | 'complete'
  windowStart: Date | null
  windowEnd: Date
  anomaly: boolean
  anomalyReasons: string[]
  algorithmVersion: typeof MOMENTUM_ALGORITHM_VERSION
}

function baseline(
  snapshots: MomentumSnapshot[],
  current: MomentumSnapshot,
  days: number,
  minimumSpan: number,
) {
  const candidates = snapshots.filter(
    (snapshot) => snapshot.observedAt < current.observedAt,
  )
  const target = current.observedAt.getTime() - days * DAY
  const candidate = candidates
    .filter(
      (snapshot) =>
        current.observedAt.getTime() - snapshot.observedAt.getTime() >=
        minimumSpan * DAY,
    )
    .sort(
      (a, b) =>
        Math.abs(a.observedAt.getTime() - target) -
        Math.abs(b.observedAt.getTime() - target),
    )
    .at(0)
  return candidate ?? null
}

export function calculateMomentumEvidence(
  snapshots: MomentumSnapshot[],
): MomentumEvidence | null {
  const ordered = [...snapshots].sort(
    (a, b) => a.observedAt.getTime() - b.observedAt.getTime(),
  )
  const current = ordered.at(-1)
  if (!current) return null

  const weekly = baseline(ordered, current, 7, 5)
  const monthly = baseline(ordered, current, 30, 21)
  const absolute7d = weekly ? Math.max(current.stars - weekly.stars, 0) : null
  const absolute30d = monthly
    ? Math.max(current.stars - monthly.stars, 0)
    : null
  const relative7d = weekly
    ? Math.max(current.stars - weekly.stars, 0) / Math.max(weekly.stars, 100)
    : null
  const relative30d = monthly
    ? Math.max(current.stars - monthly.stars, 0) / Math.max(monthly.stars, 100)
    : null
  const ageSincePush = current.pushedAt
    ? (current.observedAt.getTime() - current.pushedAt.getTime()) / DAY
    : Infinity
  const ageSinceRelease = current.latestReleaseAt
    ? (current.observedAt.getTime() - current.latestReleaseAt.getTime()) / DAY
    : Infinity
  const activityFactor =
    ageSincePush <= 14 || ageSinceRelease <= 30
      ? 1
      : ageSincePush <= 30 || ageSinceRelease <= 90
        ? 0.5
        : 0
  const anomalyReasons: string[] = []
  if (weekly) {
    const observedWeeklyDelta = current.stars - weekly.stars
    if (
      observedWeeklyDelta >= 1_000 &&
      observedWeeklyDelta / Math.max(weekly.stars, 100) >= 0.5
    )
      anomalyReasons.push('unusual_weekly_growth')
    if (observedWeeklyDelta < 0) anomalyReasons.push('star_count_decreased')
  }

  return {
    currentSnapshotId: current.id,
    weeklySnapshotId: weekly?.id ?? null,
    monthlySnapshotId: monthly?.id ?? null,
    stars: current.stars,
    absolute7d,
    absolute30d,
    relative7d,
    relative30d,
    activityFactor,
    confidence: monthly ? 'complete' : weekly ? 'weekly' : 'early',
    windowStart: (monthly ?? weekly)?.observedAt ?? null,
    windowEnd: current.observedAt,
    anomaly: anomalyReasons.length > 0,
    anomalyReasons,
    algorithmVersion: MOMENTUM_ALGORITHM_VERSION,
  }
}

function percentile(value: number | null, values: number[]) {
  if (value === null || values.length === 0) return 0
  if (values.length === 1) return 1
  const below = values.filter((candidate) => candidate < value).length
  const equal = values.filter((candidate) => candidate === value).length
  return (below + (equal - 1) / 2) / (values.length - 1)
}

export function scoreMomentumWithinCategory(items: MomentumEvidence[]) {
  const ranked = items.filter((item) => item.absolute7d !== null)
  const weekly = ranked.map((item) => Math.log1p(item.absolute7d ?? 0))
  const monthly = ranked.map((item) => Math.log1p(item.absolute30d ?? 0))
  const relative = ranked.map((item) => item.relative7d ?? 0)
  return new Map(
    items.map((item) => {
      if (item.absolute7d === null) return [item.currentSnapshotId, null]
      const score =
        0.45 * percentile(Math.log1p(item.absolute7d), weekly) +
        0.25 * percentile(Math.log1p(item.absolute30d ?? 0), monthly) +
        0.2 * percentile(item.relative7d, relative) +
        0.1 * item.activityFactor
      return [item.currentSnapshotId, score]
    }),
  )
}
