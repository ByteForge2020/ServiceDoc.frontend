import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { brandsApi } from '../../api/brandsApi'

export const brandKeys = {
  all: ['brands'] as const,
}

export function useBrandsQuery() {
  return useQuery({ queryKey: brandKeys.all, queryFn: brandsApi.getAll })
}

export function useCreateBrandMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: brandsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandKeys.all })
    },
  })
}
