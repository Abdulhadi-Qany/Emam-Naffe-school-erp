'use client'

/**
 * Resource hooks for the ERP pages.
 *
 * `useResource(fetcher, deps)` keeps the loading/error/reload pattern every
 * page already had, so swapping mock data for API calls is a one-line change:
 *
 * ```tsx
 * const { data, loading, error, reload } = useResource(
 *   (signal) => api.get<Item[]>('/items', { signal }),
 *   []
 * )
 * ```
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiRequestError } from '@/lib/api/client'

export interface Resource<T> {
  data: T | null
  loading: boolean
  error: { code: string; message: string } | null
  reload: () => void
}

export function useResource<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: readonly unknown[]
): Resource<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<{ code: string; message: string } | null>(null)
  const [nonce, setNonce] = useState(0)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    setLoading(true)
    setError(null)

    fetcherRef
      .current(controller.signal)
      .then((result) => {
        if (!active) return
        setData(result)
        setLoading(false)
      })
      .catch((cause: unknown) => {
        if (!active || controller.signal.aborted) return
        const apiError = cause instanceof ApiRequestError ? cause : null
        setError({
          code: apiError?.code ?? 'UNKNOWN',
          message: apiError?.message ?? (cause instanceof Error ? cause.message : 'Request failed'),
        })
        setLoading(false)
      })

    return () => {
      active = false
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce])

  const reload = useCallback(() => setNonce((value) => value + 1), [])

  return { data, loading, error, reload }
}

export interface Mutation {
  submitting: boolean
  error: { code: string; message: string } | null
  run: (action: () => Promise<void>) => Promise<boolean>
}

/** Mutation helper for forms (POST/PUT/DELETE) with a submitting flag. */
export function useMutation(): Mutation {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<{ code: string; message: string } | null>(null)

  const run = useCallback(async (action: () => Promise<void>) => {
    setSubmitting(true)
    setError(null)
    try {
      await action()
      return true
    } catch (cause: unknown) {
      const apiError = cause instanceof ApiRequestError ? cause : null
      setError({
        code: apiError?.code ?? 'UNKNOWN',
        message: apiError?.message ?? (cause instanceof Error ? cause.message : 'Request failed'),
      })
      return false
    } finally {
      setSubmitting(false)
    }
  }, [])

  return { submitting, error, run }
}

/** Shared pagination state for list pages. */
export function usePagination(initialLimit = 50) {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(initialLimit)
  return {
    page,
    limit,
    setPage,
    setLimit: (next: number) => {
      setLimit(next)
      setPage(1)
    },
  }
}
