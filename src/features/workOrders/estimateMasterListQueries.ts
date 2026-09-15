import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { estimateMasterListApi } from '../../api/estimateMasterListApi'

export const estimateMasterListKeys = {
  all: ['estimateMasterList'] as const,
  items: ['estimateMasterList', 'items'] as const,
}

export function useEstimateMasterListItemsQuery() {
  return useQuery({
    queryKey: estimateMasterListKeys.items,
    queryFn: estimateMasterListApi.getAll,
    staleTime: 5 * 60_000,
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
