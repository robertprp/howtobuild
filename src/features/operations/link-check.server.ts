import { Resolver } from 'node:dns/promises'
import { request } from 'node:https'
import { BlockList, isIP } from 'node:net'

export type LinkCheckResult = {
  status:
    'reachable' | 'broken' | 'redirect' | 'restricted' | 'blocked' | 'error'
  httpStatus: number | null
  detail: string
}

const blocked = new BlockList()
// Azure's platform virtual IP is outside the usual private-address ranges.
blocked.addAddress('168.63.129.16', 'ipv4')
for (const [network, prefix] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 8],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
] as const)
  blocked.addSubnet(network, prefix, 'ipv4')

export function approvedLinkHosts() {
  return new Set(
    (process.env.LINK_CHECK_ALLOWED_HOSTS ?? '')
      .split(',')
      .map((host) => host.trim().toLowerCase())
      .filter(Boolean),
  )
}

export async function checkPublishedLink(
  raw: string,
): Promise<LinkCheckResult> {
  const result = (
    status: LinkCheckResult['status'],
    detail: string,
    httpStatus: number | null = null,
  ): LinkCheckResult => ({ status, detail, httpStatus })
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return result('blocked', 'Invalid URL')
  }
  if (
    raw.length > 2048 ||
    url.protocol !== 'https:' ||
    url.port ||
    url.username ||
    url.password ||
    url.search ||
    isIP(url.hostname) ||
    !approvedLinkHosts().has(url.hostname)
  ) {
    return result(
      'blocked',
      'Requires an approved HTTPS hostname, default port, and no credentials or query string',
    )
  }

  // IPv4-only by design: no implicit IPv6 fallback or second DNS resolution.
  const resolver = new Resolver({ timeout: 1500, tries: 1 })
  const dnsDeadline = setTimeout(() => resolver.cancel(), 1500)
  let addresses: string[]
  try {
    addresses = await resolver.resolve4(url.hostname)
  } catch {
    return result('error', 'DNS lookup failed or timed out; IPv4 is required')
  } finally {
    clearTimeout(dnsDeadline)
  }
  if (
    !addresses.length ||
    addresses.some(
      (address) => isIP(address) !== 4 || blocked.check(address, 'ipv4'),
    )
  ) {
    return result('blocked', 'DNS returned a non-public or unsupported address')
  }
  return new Promise((resolve) => {
    // Pin the actual TCP destination, retaining the original TLS identity/Host.
    // Never use fetch here: it would resolve DNS again and follow redirects.
    const req = request(
      {
        hostname: addresses[0],
        family: 4,
        port: 443,
        servername: url.hostname,
        rejectUnauthorized: true,
        method: 'HEAD',
        path: url.pathname,
        agent: false,
        maxHeaderSize: 16_384,
        headers: {
          Host: url.hostname,
          'User-Agent': 'HowToBuild-LinkMonitor/1.0',
          Accept: '*/*',
        },
      },
      (response) => {
        const code = response.statusCode ?? 0
        response.destroy()
        if (code >= 200 && code < 300)
          resolve(
            result(
              'reachable',
              'HEAD request succeeded; content not verified',
              code,
            ),
          )
        else if (code === 404 || code === 410)
          resolve(
            result(
              'broken',
              'Not found or gone; confirm manually before editing',
              code,
            ),
          )
        else if (code >= 300 && code < 400)
          resolve(
            result(
              'redirect',
              'Redirect not followed; verify destination manually',
              code,
            ),
          )
        else if ([401, 403, 405, 429, 501].includes(code))
          resolve(
            result(
              'restricted',
              'Authentication, bot/rate restriction, or HEAD unsupported',
              code,
            ),
          )
        else
          resolve(
            result(
              'error',
              'Unexpected HTTP response; may be temporary',
              code || null,
            ),
          )
      },
    )
    const timer = setTimeout(() => req.destroy(new Error('deadline')), 3500)
    req.once('close', () => clearTimeout(timer))
    req.once('error', () =>
      resolve(result('error', 'Connection, TLS, or request deadline failure')),
    )
    req.end()
  })
}
