import { useEffect } from 'react'
import { startTelemetry } from '../features/operations/telemetry-browser'

export function Telemetry() {
  useEffect(() => {
    startTelemetry()
  }, [])
  return null
}
