import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { workOrdersApi } from '../../api/workOrdersApi'
import type { UpdateWorkOrderRequest } from './types'

export const workOrderKeys = {
  all: ['workOrders'] as const,
  detail: (id: string) => ['workOrders', id] as const,
  recent: (take: number) => ['workOrders', 'recent', take] as const,
  search: (query: string) => ['workOrders', 'search', query] as const,
}

export function useWorkOrdersQuery() {
  return useQuery({
    queryKey: workOrderKeys.all,
    queryFn: workOrdersApi.getAll,
  })
}

export function useWorkOrderQuery(id: string | undefined) {
  return useQuery({
    queryKey: workOrderKeys.detail(id ?? ''),
    queryFn: () => workOrdersApi.getById(id!),
    enabled: !!id,
  })
}

export function useCreateWorkOrderMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: workOrdersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workOrderKeys.all })
    },
  })
}

export function useRecentWorkOrdersQuery(take = 6) {
  return useQuery({
    queryKey: workOrderKeys.recent(take),
    queryFn: () => workOrdersApi.getRecent(take),
    staleTime: 30_000,
  })
}

export function useWorkOrdersSearchQuery(query: string) {
  const trimmed = query.trim()
  return useQuery({
    queryKey: workOrderKeys.search(trimmed),
    queryFn: () => workOrdersApi.search(trimmed),
    enabled: trimmed.length >= 1,
    staleTime: 10_000,
  })
}

export function useUpdateWorkOrderMutation(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: UpdateWorkOrderRequest) => workOrdersApi.update(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workOrderKeys.all })
      queryClient.invalidateQueries({ queryKey: workOrderKeys.detail(id) })
    },
  })
}
