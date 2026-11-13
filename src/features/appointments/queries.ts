import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { appointmentsApi } from '../../api/appointmentsApi'
import { appointmentBookingKeys, appointmentJobKeys } from '../appointmentSlots/keys'
import { jobsKeys } from '../jobs/queries'
import { serviceBayBookingKeys } from '../serviceBayBookings/queries'
import { workOrderKeys } from '../workOrders/queries'
import type { CreateAppointmentRequest, UpdateAppointmentRequest } from './types'

export const appointmentKeys = {
  all: ['appointments'] as const,
  range: (from: string, to: string) => ['appointments', from, to] as const,
  detail: (id: string) => ['appointments', id] as const,
  upcoming: (take: number) => ['appointments', 'upcoming', take] as const,
  recent: (take: number) => ['appointments', 'recent', take] as const,
  search: (query: string) => ['appointments', 'search', query] as const,
}

// An appointment's slots are removed with it, and become the work order's jobs and bookings when it is converted.
function invalidateSlotData(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: appointmentJobKeys.all })
  queryClient.invalidateQueries({ queryKey: appointmentBookingKeys.all })
}

export function useAppointmentsQuery(from: string, to: string) {
  return useQuery({
    queryKey: appointmentKeys.range(from, to),
    queryFn: () => appointmentsApi.getAll(from, to),
  })
}

export function useUpcomingAppointmentsQuery(take = 6) {
  return useQuery({
    queryKey: appointmentKeys.upcoming(take),
    queryFn: () => appointmentsApi.getUpcoming(take),
    staleTime: 30_000,
  })
}

/** The appointments made most recently that are still to be converted, whatever their date. */
export function useRecentAppointmentsQuery(take = 6) {
  return useQuery({
    queryKey: appointmentKeys.recent(take),
    queryFn: () => appointmentsApi.getRecent(take),
    staleTime: 30_000,
  })
}

export function useAppointmentsSearchQuery(query: string) {
  const trimmed = query.trim()
  return useQuery({
    queryKey: appointmentKeys.search(trimmed),
    queryFn: () => appointmentsApi.search(trimmed),
    enabled: trimmed.length >= 1,
    staleTime: 10_000,
  })
}

export function useAppointmentQuery(id: string | undefined) {
  return useQuery({
    queryKey: appointmentKeys.detail(id ?? ''),
    queryFn: () => appointmentsApi.getById(id!),
    enabled: !!id,
  })
}

export function useCreateAppointmentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: CreateAppointmentRequest) => appointmentsApi.create(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all })
    },
  })
}

export function useUpdateAppointmentMutation(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: UpdateAppointmentRequest) => appointmentsApi.update(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all })
    },
  })
}

export function useDeleteAppointmentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => appointmentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all })
      invalidateSlotData(queryClient)
    },
  })
}

export function useConvertAppointmentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => appointmentsApi.convertToWorkOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all })
      invalidateSlotData(queryClient)
      queryClient.invalidateQueries({ queryKey: jobsKeys.all })
      queryClient.invalidateQueries({ queryKey: serviceBayBookingKeys.all })
      queryClient.invalidateQueries({ queryKey: workOrderKeys.all })
    },
  })
}
