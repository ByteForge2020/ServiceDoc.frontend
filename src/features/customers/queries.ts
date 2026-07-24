import { useQuery } from '@tanstack/react-query'
import { customersApi } from '../../api/customersApi'

export const customerKeys = {
  search: (query: string) => ['customers', 'search', query] as const,
}

export function useSearchCustomersQuery(query: string) {
  const trimmed = query.trim()
  return useQuery({
    queryKey: customerKeys.search(trimmed),
    queryFn: () => customersApi.search(trimmed),
    enabled: trimmed.length >= 2,
    staleTime: 10_000,
  })
}
