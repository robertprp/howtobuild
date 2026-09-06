import { createReadStream } from 'node:fs'
import { createInterface } from 'node:readline'
import { telemetrySchema } from '../src/features/operations/telemetry'

const path = process.argv[2]
if (!path)
  throw new Error('Usage: pnpm product:report /path/to/telemetry.ndjson')
const counts = new Map<string, number>()
let ignored = 0
let accepted = 0
for await (const line of createInterface({
  input: createReadStream(path),
  crlfDelay: Infinity,
})) {
  try {
    const record = JSON.parse(line) as { event?: unknown; receivedAt?: string }
    const parsed = telemetrySchema.safeParse(record.event)
    if (
      !parsed.success ||
      parsed.data.kind !== 'product' ||
      !record.receivedAt ||
      !Number.isFinite(Date.parse(record.receivedAt))
    ) {
      ignored++
      continue
    }
    const day = new Date(record.receivedAt).toISOString().slice(0, 10)
    const key = `${day} | ${parsed.data.path} | ${parsed.data.event}`
    counts.set(key, (counts.get(key) ?? 0) + 1)
    accepted++
  } catch {
    ignored++
  }
}
console.log(
  JSON.stringify(
    {
      note: 'Unverified action counts, not unique visitors, human reach, attributed conversions, or completed builds. Bots, retries and duplicate exported logs may inflate counts; privacy controls and blocking may reduce them. Export each record once. Download events indicate a requested download, not a confirmed file save.',
      accepted,
      ignored,
      counts: [...counts]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([group, count]) => ({ group, count })),
    },
    null,
    2,
  ),
)
