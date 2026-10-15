'use client'

/**
 * Typed API client for the EBPS backend.
 *
 * - Sends cookies automatically (better-auth session).
 * - Sends the `x-school-id` header so server routes scope every query.
 * - Normalizes errors to `{ code, message }`.
 */

export const DEFAULT_SCHOOL_ID = 'emam-bukhari-private-school'

export interface ApiError {
  code: string
  message: string
  status: number
}

export class ApiRequestError extends Error implements ApiError {
  code: string
  status: number

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
    this.code = code
  }
}

const SCHOOL_HEADER = 'x-school-id'

export interface RequestOptions {
  query?: Record<string, string | number | boolean | undefined | null>
  body?: unknown
  signal?: AbortSignal
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const base = path.startsWith('/api') ? path : `/api${path}`
  if (!query) return base
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue
    params.set(key, String(value))
  }
  const search = params.toString()
  return search ? `${base}?${search}` : base
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  const url = buildUrl(path, options.query)
  const headers: Record<string, string> = { [SCHOOL_HEADER]: localStorage.getItem('schoolId') || DEFAULT_SCHOOL_ID }
  let body: BodyInit | undefined
  if (options.body !== undefined) {
    if (typeof FormData !== 'undefined' && options.body instanceof FormData) {
      body = options.body
    } else {
      headers['content-type'] = 'application/json'
      body = JSON.stringify(options.body)
    }
  }

  const response = await fetch(url, {
    method,
    headers,
    credentials: 'include',
    body,
    signal: options.signal,
  })

  if (response.status === 204) return undefined as T

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const code = (payload && typeof payload === 'object' && 'code' in payload ? String(payload.code) : `HTTP_${response.status}`)
    const message =
      payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
        ? payload.error
        : `Request failed with status ${response.status}`
    throw new ApiRequestError(response.status, code, message)
  }

  return payload as T
}

/** `{ data, pagination }` envelope used by collection endpoints. */
export interface Paginated<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('POST', path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('PUT', path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>('PATCH', path, { ...options, body }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>('DELETE', path, options),
}

export default api
