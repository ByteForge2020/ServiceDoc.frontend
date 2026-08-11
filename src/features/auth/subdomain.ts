const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1'])
const IPV4_PATTERN = /^\d{1,3}(\.\d{1,3}){3}$/

// In production each shop is served from its own subdomain (e.g. bmwservice.servicedoc.com).
function getHostnameSubdomain(): string | null {
  const hostname = window.location.hostname.toLowerCase()

  if (LOCAL_HOSTNAMES.has(hostname) || IPV4_PATTERN.test(hostname)) {
    return null
  }

  const labels = hostname.split('.')
  if (labels.length <= 2) {
    return null
  }

  return labels[0]
}

// Locally (localhost, an IP, or a bare domain) there's no real subdomain to read, so dev builds
// fall back to VITE_DEV_SUBDOMAIN (see .env) instead of asking the user to type one in.
export function resolveSubdomain(): string | null {
  return getHostnameSubdomain() ?? import.meta.env.VITE_DEV_SUBDOMAIN ?? null
}
