import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { appointmentSettingsApi, type DaySchedule } from '../../../api/appointmentSettingsApi'

const appointmentSettingsKey = ['appointmentSettings'] as const

export function useAppointmentSettingsQuery() {
  return useQuery({
    queryKey: appointmentSettingsKey,
    queryFn: appointmentSettingsApi.getSettings,
  })
}

export function useUpdateAppointmentSettingsMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (defaultAppointmentDurationMinutes: number) =>
      appointmentSettingsApi.updateSettings(defaultAppointmentDurationMinutes),
    onSuccess: (data) => {
      queryClient.setQueryData(appointmentSettingsKey, data)
    },
  })
}

/** The shop's working hours; the calendars read them from the same settings, so they follow the change at once. */
export function useUpdateWorkScheduleMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (schedule: DaySchedule[]) => appointmentSettingsApi.updateWorkSchedule(schedule),
    onSuccess: (data) => {
      queryClient.setQueryData(appointmentSettingsKey, data)
    },
  })
}
