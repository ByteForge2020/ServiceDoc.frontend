import { useQuery } from '@tanstack/react-query'
import { workOrdersApi } from '../../api/workOrdersApi'

export const workOrderKeys = {
  all: ['workOrders'] as const,
  detail: (id: string) => ['workOrders', id] as const,
}

export function useWorkOrdersQuery() {
  return useQuery({
    queryKey: workOrderKeys.all,
    queryFn: workOrdersApi.getAll,
  })
}
