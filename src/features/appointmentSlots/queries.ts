import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { appointmentJobsApi } from '../../api/appointmentJobsApi'
import { appointmentServiceBayBookingsApi } from '../../api/appointmentServiceBayBookingsApi'
import { appointmentKeys } from '../appointments/queries'
import { appointmentBookingKeys, appointmentJobKeys } from './keys'
import type {
  AppointmentJob,
  AppointmentServiceBayBooking,
  CreateAppointmentJobPayload,
  CreateAppointmentServiceBayBookingPayload,
  RescheduleAppointmentJobPayload,
  RescheduleAppointmentServiceBayBookingPayload,
  UpdateAppointmentJobPayload,
  UpdateAppointmentServiceBayBookingPayload,
} from './types'

// The appointments page shows each appointment's slots, so it has to follow every change made in the calendar.
function invalidateJobData(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: appointmentJobKeys.all })
  queryClient.invalidateQueries({ queryKey: appointmentKeys.all })
}

function invalidateBookingData(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: appointmentBookingKeys.all })
  queryClient.invalidateQueries({ queryKey: appointmentKeys.all })
}

export function useAppointmentJobsQuery(from: string, to: string) {
  return useQuery({
    queryKey: appointmentJobKeys.range(from, to),
    queryFn: () => appointmentJobsApi.getAll(from, to),
    // Keeps the grid mounted while the date changes mid-drag.
    placeholderData: keepPreviousData,
  })
}

export function useAppointmentServiceBayBookingsQuery(from: string, to: string) {
  return useQuery({
    queryKey: appointmentBookingKeys.range(from, to),
    queryFn: () => appointmentServiceBayBookingsApi.getAll(from, to),
    // Keeps the grid mounted while the date changes mid-drag.
    placeholderData: keepPreviousData,
  })
}

interface RescheduleAppointmentJobVariables extends RescheduleAppointmentJobPayload {
  id: string
  assignedUserName: string
}

export function useRescheduleAppointmentJobMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, assignedUserId, scheduledTime }: RescheduleAppointmentJobVariables) =>
      appointmentJobsApi.reschedule(id, { assignedUserId, scheduledTime }),
    onMutate: async ({ id, assignedUserId, assignedUserName, scheduledTime }) => {
      await queryClient.cancelQueries({ queryKey: appointmentJobKeys.all })
      const previous = queryClient.getQueriesData<AppointmentJob[]>({ queryKey: appointmentJobKeys.all })

      queryClient.setQueriesData<AppointmentJob[]>({ queryKey: appointmentJobKeys.all }, (jobs) =>
        jobs?.map((job) => (job.id === id ? { ...job, assignedUserId, assignedUserName, scheduledTime } : job)),
      )

      return { previous }
    },
    onError: (_error, _variables, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data))
    },
    onSettled: () => invalidateJobData(queryClient),
  })
}

interface RescheduleAppointmentBookingVariables extends RescheduleAppointmentServiceBayBookingPayload {
  id: string
  serviceBayName: string
}

export function useRescheduleAppointmentServiceBayBookingMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, serviceBayId, scheduledTime }: RescheduleAppointmentBookingVariables) =>
      appointmentServiceBayBookingsApi.reschedule(id, { serviceBayId, scheduledTime }),
    onMutate: async ({ id, serviceBayId, serviceBayName, scheduledTime }) => {
      await queryClient.cancelQueries({ queryKey: appointmentBookingKeys.all })
      const previous = queryClient.getQueriesData<AppointmentServiceBayBooking[]>({
        queryKey: appointmentBookingKeys.all,
      })

      queryClient.setQueriesData<AppointmentServiceBayBooking[]>({ queryKey: appointmentBookingKeys.all }, (bookings) =>
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

export function useCreateAppointmentJobMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateAppointmentJobPayload) => appointmentJobsApi.create(payload),
    onSuccess: () => invalidateJobData(queryClient),
  })
}

export function useUpdateAppointmentJobMutation(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateAppointmentJobPayload) => appointmentJobsApi.update(id, payload),
    onSuccess: () => invalidateJobData(queryClient),
  })
}

export function useDeleteAppointmentJobMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => appointmentJobsApi.delete(id),
    onSuccess: () => invalidateJobData(queryClient),
  })
}

export function useCreateAppointmentServiceBayBookingMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateAppointmentServiceBayBookingPayload) => appointmentServiceBayBookingsApi.create(payload),
    onSuccess: () => invalidateBookingData(queryClient),
  })
}

export function useUpdateAppointmentServiceBayBookingMutation(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateAppointmentServiceBayBookingPayload) =>
      appointmentServiceBayBookingsApi.update(id, payload),
    onSuccess: () => invalidateBookingData(queryClient),
  })
}

export function useDeleteAppointmentServiceBayBookingMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => appointmentServiceBayBookingsApi.delete(id),
    onSuccess: () => invalidateBookingData(queryClient),
  })
}
