import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { appointmentsApi } from '../../api/appointmentsApi'
import type { CreateAppointmentRequest, UpdateAppointmentRequest } from './types'

export const appointmentKeys = {
  all: ['appointments'] as const,
  range: (from: string, to: string) => ['appointments', from, to] as const,
  detail: (id: string) => ['appointments', id] as const,
}

export function useAppointmentsQuery(from: string, to: string) {
  return useQuery({
    queryKey: appointmentKeys.range(from, to),
    queryFn: () => appointmentsApi.getAll(from, to),
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
    },
  })
}

export function useConvertAppointmentMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => appointmentsApi.convertToWorkOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all })
    },
  })
}
