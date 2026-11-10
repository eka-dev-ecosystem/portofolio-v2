export default defineEventHandler((event) => {
  const host = getRequestHeader(event, 'x-forwarded-host') || getRequestHeader(event, 'host') || ''
  const proto = getRequestHeader(event, 'x-forwarded-proto')

  // Only apply domain canonicalization for production eka-dev.cloud
  if (host.includes('eka-dev.cloud')) {
    // 1. 301 Redirect www.eka-dev.cloud to canonical eka-dev.cloud
    if (host.startsWith('www.')) {
      const url = event.node.req.url || '/'
      return sendRedirect(event, `https://eka-dev.cloud${url}`, 301)
    }

    // 2. 301 Redirect unencrypted http to https (when signaled by reverse proxy/Cloudflare)
    if (proto === 'http') {
      const url = event.node.req.url || '/'
      return sendRedirect(event, `https://eka-dev.cloud${url}`, 301)
    }
  }
})

