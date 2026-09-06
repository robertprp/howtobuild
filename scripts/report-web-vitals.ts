import { createReadStream } from 'node:fs'
import { createInterface } from 'node:readline'
import {
  telemetryRoute,
  telemetrySchema,
} from '../src/features/operations/telemetry'

// Read an operator-exported NDJSON stream; never connect to providers or a DB.
const path = process.argv[2]
if (!path)
  throw new Error('Usage: pnpm metrics:report /path/to/telemetry.ndjson')
type Observation = {
  name: string
  value: number
  sequence: number
  path: string
  viewport: string
}
const latest = new Map<string, Observation>()
let ignored = 0
const lines = createInterface({
  input: createReadStream(path),
  crlfDelay: Infinity,
})
for await (const line of lines) {
  try {
    const record = JSON.parse(line) as { event?: unknown }
    const parsed = telemetrySchema.safeParse(record.event)
    if (!parsed.success || parsed.data.kind !== 'web-vitals') {
      ignored++
      continue
    }
    const event = parsed.data
    for (const metric of event.metrics) {
      const key = `${metric.name}:${metric.id}`
      const previous = latest.get(key)
      if (!previous || metric.sequence > previous.sequence)
        latest.set(key, {
          name: metric.name,
          value: metric.value,
          sequence: metric.sequence,
          path: telemetryRoute(event.path),
          viewport:
            Number(event.viewport.split('x')[0]) <= 767 ? 'narrow' : 'wide',
        })
    }
  } catch {
    ignored++
  }
}
const groups = new Map<string, number[]>()
for (const metric of latest.values()) {
  const key = `${metric.path} | ${metric.viewport} | ${metric.name}`
  const values = groups.get(key) ?? []
  values.push(metric.value)
  groups.set(key, values)
}
const rows = [...groups]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([group, values]) => {
    values.sort((a, b) => a - b)
    const p75 = values[Math.ceil(values.length * 0.75) - 1]
    const name = group.split(' | ')[2]
    const threshold = name === 'CLS' ? 0.1 : name === 'INP' ? 200 : 2500
    return {
      group,
      observations: values.length,
      p75,
      unit: name === 'CLS' ? 'score' : 'ms',
      goodThreshold: threshold,
      assessment:
        values.length < 50
          ? 'insufficient sample (internal threshold: 50)'
          : p75 <= threshold
            ? 'within target in this export'
            : 'above target in this export',
    }
  })
console.log(
  JSON.stringify(
    {
      source: 'web-vitals/6.2.1',
      ignoredRecords: ignored,
      groups: rows,
      caveat:
        'Viewport cohorts are not device identification. Export coverage, traffic validity, collection window, and sample sufficiency require operator review. No launch signoff inferred.',
    },
    null,
    2,
  ),
)
