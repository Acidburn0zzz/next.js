import type { I18NConfig } from '../../config-shared'
import { NextURL } from '../next-url'
import { toNodeHeaders, validateURL } from '../utils'

import { NextCookies } from './cookies'

const INTERNALS = Symbol('internal response')
const REDIRECTS = new Set([301, 302, 303, 307, 308])

export class NextResponse extends Response {
  [INTERNALS]: {
    cookies: NextCookies
    url?: NextURL
  }

  constructor(body?: BodyInit | null, init: ResponseInit = {}) {
    super(body, init)

    this[INTERNALS] = {
      cookies: new NextCookies(this),
      url: init.url
        ? new NextURL(init.url, {
            headers: toNodeHeaders(this.headers),
            nextConfig: init.nextConfig,
          })
        : undefined,
    }
  }

  public get cookies() {
    return this[INTERNALS].cookies
  }

  static json(body: any, init?: ResponseInit): NextResponse {
    // @ts-expect-error This is not in lib/dom right now, and we can't augment it.
    const response: Response = Response.json(body, init)
    return new NextResponse(response.body, response)
  }

  static redirect(url: string | NextURL | URL, status = 307) {
    if (!REDIRECTS.has(status)) {
      throw new RangeError(
        'Failed to execute "redirect" on "response": Invalid status code'
      )
    }

    return new NextResponse(null, {
      headers: { Location: validateURL(url) },
      status,
    })
  }

  static rewrite(destination: string | NextURL | URL) {
    return new NextResponse(null, {
      headers: { 'x-middleware-rewrite': validateURL(destination) },
    })
  }

  static next() {
    return new NextResponse(null, {
      headers: { 'x-middleware-next': '1' },
    })
  }
}

interface ResponseInit extends globalThis.ResponseInit {
  nextConfig?: {
    basePath?: string
    i18n?: I18NConfig
    trailingSlash?: boolean
  }
  url?: string
}