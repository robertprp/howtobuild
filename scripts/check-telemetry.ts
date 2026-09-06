import { deliverTelemetry } from '../src/features/operations/telemetry-sink.server'

if (
  !process.env.OBSERVABILITY_INGEST_URL ||
  !process.env.OBSERVABILITY_INGEST_TOKEN
)
  throw new Error('Configure the ingestion URL and source token first')
const result = await deliverTelemetry({
  service: 'howtobuild-web',
  receivedAt: new Date().toISOString(),
  event: { kind: 'integration-check', source: 'manual-cli' },
})
console.log(
  `Telemetry diagnostic: ${result}. Search Live tail for howtobuild.integration-check.`,
)
if (result !== 'sent') process.exitCode = 1
