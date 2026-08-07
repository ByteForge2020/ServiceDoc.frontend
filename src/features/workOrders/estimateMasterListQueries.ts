import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { estimateMasterListApi } from '../../api/estimateMasterListApi'

export const estimateMasterListKeys = {
  all: ['estimateMasterList'] as const,
  defaults: ['estimateMasterList', 'defaults'] as const,
  search: (query: string) => ['estimateMasterList', 'search', query] as const,
}

export function useEstimateMasterListDefaultsQuery() {
  return useQuery({
    queryKey: estimateMasterListKeys.defaults,
    queryFn: estimateMasterListApi.getDefaults,
    staleTime: 5 * 60_000,
  })
}

export function useEstimateMasterListSearchQuery(query: string) {
  const trimmed = query.trim()
  return useQuery({
    queryKey: estimateMasterListKeys.search(trimmed),
    queryFn: () => estimateMasterListApi.search(trimmed),
    enabled: trimmed.length >= 2,
    staleTime: 10_000,
  })
}

export function useCreateEstimateMasterListItemMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (name: string) => estimateMasterListApi.create(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: estimateMasterListKeys.all })
    },
  })
}
