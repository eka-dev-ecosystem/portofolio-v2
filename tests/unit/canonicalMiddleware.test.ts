import { describe, it, expect, vi } from 'vitest'
import canonicalMiddleware from '../../server/middleware/canonical'

describe('Canonical 301 Redirect Middleware', () => {
  it('should redirect www.eka-dev.cloud to apex https://eka-dev.cloud', async () => {
    let redirectedUrl = ''
    let redirectedCode = 0

    const mockEvent = {
      node: {
        req: {
          headers: {
            host: 'www.eka-dev.cloud',
          },
          url: '/apps',
        },
      },
    } as any

    vi.stubGlobal('getRequestHeader', (event: any, header: string) => {
      return event.node.req.headers[header] || undefined
    })

    vi.stubGlobal('sendRedirect', (event: any, url: string, code: number) => {
      redirectedUrl = url
      redirectedCode = code
      return { redirected: true }
    })

    await canonicalMiddleware(mockEvent)

    expect(redirectedCode).toBe(301)
    expect(redirectedUrl).toBe('https://eka-dev.cloud/apps')
  })

  it('should redirect http to https for eka-dev.cloud', async () => {
    let redirectedUrl = ''
    let redirectedCode = 0

    const mockEvent = {
      node: {
        req: {
          headers: {
            host: 'eka-dev.cloud',
            'x-forwarded-proto': 'http',
          },
          url: '/privacy',
        },
      },
    } as any

    vi.stubGlobal('getRequestHeader', (event: any, header: string) => {
      return event.node.req.headers[header] || undefined
    })

    vi.stubGlobal('sendRedirect', (event: any, url: string, code: number) => {
      redirectedUrl = url
      redirectedCode = code
      return { redirected: true }
    })

    await canonicalMiddleware(mockEvent)

    expect(redirectedCode).toBe(301)
    expect(redirectedUrl).toBe('https://eka-dev.cloud/privacy')
  })

  it('should NOT redirect valid https requests to eka-dev.cloud', async () => {
    let redirected = false

    const mockEvent = {
      node: {
        req: {
          headers: {
            host: 'eka-dev.cloud',
            'x-forwarded-proto': 'https',
          },
          url: '/',
        },
      },
    } as any

    vi.stubGlobal('getRequestHeader', (event: any, header: string) => {
      return event.node.req.headers[header] || undefined
    })

    vi.stubGlobal('sendRedirect', () => {
      redirected = true
    })

    await canonicalMiddleware(mockEvent)

    expect(redirected).toBe(false)
  })

  it('should NOT redirect localhost or test environments', async () => {
    let redirected = false

    const mockEvent = {
      node: {
        req: {
          headers: {
            host: 'localhost:3000',
            'x-forwarded-proto': 'http',
          },
          url: '/',
        },
      },
    } as any

    vi.stubGlobal('getRequestHeader', (event: any, header: string) => {
      return event.node.req.headers[header] || undefined
    })

    vi.stubGlobal('sendRedirect', () => {
      redirected = true
    })

    await canonicalMiddleware(mockEvent)

    expect(redirected).toBe(false)
  })
})

