import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { appointmentSettingsApi, type AppointmentSettings } from '../../../api/appointmentSettingsApi'

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
    mutationFn: (payload: AppointmentSettings) => appointmentSettingsApi.updateSettings(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(appointmentSettingsKey, data)
    },
  })
}
