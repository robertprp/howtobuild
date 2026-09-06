import { Logtail } from '@logtail/node'

type TelemetryRecord = {
  service: string
  receivedAt: string
  event: Record<string, unknown>
}

let betterStack: Logtail | undefined

// Only the server imports this module. Never put the source token in VITE_*.
export async function deliverTelemetry(record: TelemetryRecord) {
  const endpoint = process.env.OBSERVABILITY_INGEST_URL
  const token = process.env.OBSERVABILITY_INGEST_TOKEN
  if (!endpoint) {
    console.info('telemetry.event', record)
    return 'console' as const
  }
  try {
    const url = new URL(endpoint)
    if (url.protocol !== 'https:' || url.username || url.password)
      throw new Error('Invalid telemetry endpoint')
    if (url.hostname.endsWith('.betterstackdata.com')) {
      if (!token) throw new Error('Missing source token')
      betterStack ??= new Logtail(token, {
        endpoint,
        captureStackContext: false,
        sendLogsToConsoleOutput: false,
        throwExceptions: true,
        retryCount: 0,
        timeout: 2000,
        batchSize: 1,
        syncQueuedMax: 20,
      })
      const message = `howtobuild.${record.event.kind}`
      if (['error', 'unhandled-rejection'].includes(String(record.event.kind)))
        await betterStack.error(message, record)
      else await betterStack.info(message, record)
      // Await delivery before serverless request completion.
      await betterStack.flush()
    } else {
      // Preserve the existing generic JSON ingestion contract for other sinks.
      const response = await fetch(url, {
        method: 'POST',
        redirect: 'error',
        signal: AbortSignal.timeout(2000),
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(record),
      })
      await response.body?.cancel()
      if (!response.ok) throw new Error('Telemetry rejected')
    }
    return 'sent' as const
  } catch {
    // Do not log tokens, URLs, transport errors or private request metadata.
    console.error('telemetry.forward.failed')
    return 'failed' as const
  }
}
