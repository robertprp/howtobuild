export function safeReturnPath(value: unknown, fallback = '/account') {
  if (typeof value !== 'string') return fallback
  try {
    const decoded = decodeURIComponent(value)
    if (
      !decoded.startsWith('/') ||
      decoded.startsWith('//') ||
      /[\\\s]/.test(decoded)
    )
      return fallback
    const url = new URL(value, 'https://howtobuild.dev')
    return url.origin === 'https://howtobuild.dev'
      ? `${url.pathname}${url.search}`
      : fallback
  } catch {
    return fallback
  }
}
