# Better Stack connection

Configured locally on 6 September 2026 following the [Node.js quick start](https://betterstack.com/docs/logs/javascript/install/).

The source's ingestion host and source token are stored only in ignored `.env`, under `OBSERVABILITY_INGEST_URL` and `OBSERVABILITY_INGEST_TOKEN`. Neither is hardcoded in application code. Never add a source token to a `VITE_` variable, committed file, screenshot or client-side SDK.

## Implementation

- Installed the pinned `@logtail/node` package using pnpm.
- `telemetry-sink.server.ts` uses the official client for Better Stack ingestion hosts; other HTTPS endpoints retain the original JSON transport.
- Existing browser events still pass through `/api/telemetry` validation and privacy controls. The SDK replaces the previous direct HTTP send for this source, rather than duplicating it.
- Automatic stack context capture and console mirroring are disabled. Records add the SDK's timestamp, level and short message to the existing structured `service`, `receivedAt` and `event` fields.
- Delivery is awaited/flushed before request completion, with a two-second request timeout, bounded queue and no automatic retry. Failed delivery emits only `telemetry.forward.failed`; the telemetry endpoint remains best-effort and its 202 response alone is not proof of ingestion.
- This is structured telemetry, not automatic capture of every application console message, server exception or request. No browser SDK, request-body capture, session replay or database integration was installed.

## Verify

Local verification succeeded: the configured source accepted the diagnostic through the Node SDK. Typecheck, lint, all nine existing tests, and production build passed; the token was not found in public build assets. The ingestion URL needed correction to a complete HTTPS URL before delivery succeeded. Live tail inspection and production deployment remain owner-side steps.

```sh
pnpm telemetry:check
```

This explicitly sends one small diagnostic record through the same server sink and reports success/failure without showing credentials. In Better Stack Live tail, search for `howtobuild.integration-check`. It is not a product action and the product report ignores it. Do not run it repeatedly to simulate audience activity.

## Production

Copy the two OBSERVABILITY variables securely into the hosting project's server environment and redeploy. Local `.env` changes do not configure production. Restart an existing local server after changing credentials; do not start duplicate dev servers. Confirm source retention, spending limits, permissions and alert ownership in Better Stack.

Product-event flags were left unchanged (disabled when this connection was configured). Performance/error telemetry does not depend on them. To additionally collect the documented coarse product actions, review privacy and retention, set both `VITE_PRODUCT_ANALYTICS_ENABLED` and `PRODUCT_ANALYTICS_ENABLED` to `true`, and rebuild/redeploy. Umami remains separate.

Rotate the source token shared during setup and update both local and production values. Account management/rotation is not performed by this code change.
