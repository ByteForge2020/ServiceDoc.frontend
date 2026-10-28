import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { serviceBaysApi } from '../../../api/serviceBaysApi'
import { workOrderKeys } from '../../workOrders/queries'

export const serviceBayKeys = {
  all: ['serviceBays'] as const,
}

// Bookings and the work orders list show a bay's name, and a deleted bay disappears from the calendar grid.
function invalidateBayDependents(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: serviceBayKeys.all })
  queryClient.invalidateQueries({ queryKey: ['serviceBayBookings'] })
  queryClient.invalidateQueries({ queryKey: workOrderKeys.all })
}

export function useServiceBaysQuery() {
  return useQuery({
    queryKey: serviceBayKeys.all,
    queryFn: serviceBaysApi.getAll,
  })
}

export function useCreateServiceBayMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (name: string) => serviceBaysApi.create(name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: serviceBayKeys.all }),
  })
}

export function useRenameServiceBayMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => serviceBaysApi.rename(id, name),
    onSuccess: () => invalidateBayDependents(queryClient),
  })
}

export function useDeleteServiceBayMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => serviceBaysApi.remove(id),
    onSuccess: () => invalidateBayDependents(queryClient),
  })
}
