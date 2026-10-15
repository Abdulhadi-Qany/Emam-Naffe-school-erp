'use client'

import { useCallback } from 'react'
import { api } from '@/lib/api/client'

export interface CrudOperations<T> {
  create: (data: Partial<T>) => Promise<T>
  update: (id: string, data: Partial<T>) => Promise<T>
  delete: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

export function useCrudOperations<T>(
  endpoint: string,
  onRefresh: () => Promise<void>
): CrudOperations<T> {
  const create = useCallback(
    async (data: Partial<T>): Promise<T> => {
      const result = await api.post<T>(endpoint, { body: data })
      await onRefresh()
      return result
    },
    [endpoint, onRefresh]
  )

  const update = useCallback(
    async (id: string, data: Partial<T>): Promise<T> => {
      const result = await api.patch<T>(`${endpoint}/${id}`, { body: data })
      await onRefresh()
      return result
    },
    [endpoint, onRefresh]
  )

  const deleteItem = useCallback(
    async (id: string): Promise<void> => {
      await api.delete(`${endpoint}/${id}`)
      await onRefresh()
    },
    [endpoint, onRefresh]
  )

  return { create, update, delete: deleteItem, refresh: onRefresh }
}