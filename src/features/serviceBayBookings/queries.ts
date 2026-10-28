import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { serviceBayBookingsApi } from '../../api/serviceBayBookingsApi'
import { workOrderKeys } from '../workOrders/queries'
import type {
  CreateServiceBayBookingPayload,
  RescheduleServiceBayBookingPayload,
  ServiceBayBooking,
  UpdateServiceBayBookingPayload,
} from './types'

export const serviceBayBookingKeys = {
  all: ['serviceBayBookings'] as const,
  range: (from: string, to: string) => ['serviceBayBookings', from, to] as const,
}

// The work orders list shows each order's bookings, so it has to follow every change made in the calendar.
function invalidateBookingData(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: serviceBayBookingKeys.all })
  queryClient.invalidateQueries({ queryKey: workOrderKeys.all })
}

export function useServiceBayBookingsQuery(from: string, to: string) {
  return useQuery({
    queryKey: serviceBayBookingKeys.range(from, to),
    queryFn: () => serviceBayBookingsApi.getAll(from, to),
    // Keeps the grid mounted while the date changes mid-drag.
    placeholderData: keepPreviousData,
  })
}

interface RescheduleServiceBayBookingVariables extends RescheduleServiceBayBookingPayload {
  id: string
  serviceBayName: string
}

export function useRescheduleServiceBayBookingMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, serviceBayId, scheduledTime }: RescheduleServiceBayBookingVariables) =>
      serviceBayBookingsApi.reschedule(id, { serviceBayId, scheduledTime }),
    onMutate: async ({ id, serviceBayId, serviceBayName, scheduledTime }) => {
      await queryClient.cancelQueries({ queryKey: serviceBayBookingKeys.all })
      const previous = queryClient.getQueriesData<ServiceBayBooking[]>({ queryKey: serviceBayBookingKeys.all })

      queryClient.setQueriesData<ServiceBayBooking[]>({ queryKey: serviceBayBookingKeys.all }, (bookings) =>
        bookings?.map((booking) =>
          booking.id === id ? { ...booking, serviceBayId, serviceBayName, scheduledTime } : booking,
        ),
      )

      return { previous }
    },
    // A rejected move (e.g. the bay is busy) puts the card back where it was.
    onError: (_error, _variables, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data))
    },
    onSettled: () => invalidateBookingData(queryClient),
  })
}

export function useCreateServiceBayBookingMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateServiceBayBookingPayload) => serviceBayBookingsApi.create(payload),
    onSuccess: () => invalidateBookingData(queryClient),
  })
}

export function useUpdateServiceBayBookingMutation(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateServiceBayBookingPayload) => serviceBayBookingsApi.update(id, payload),
    onSuccess: () => invalidateBookingData(queryClient),
  })
}

export function useDeleteServiceBayBookingMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => serviceBayBookingsApi.delete(id),
    onSuccess: () => invalidateBookingData(queryClient),
  })
}
