import { apiClient } from './apiClient'

const BASE_PATH = '/api/v1/general/shop/appointment-settings'

export interface DaySchedule {
  dayOfWeek: number
  isEnabled: boolean
  openingTimeMinutes: number
  closingTimeMinutes: number
}

export interface AppointmentSettings {
  defaultAppointmentDurationMinutes: number
  schedule: DaySchedule[]
}

export const appointmentSettingsApi = {
  getSettings() {
    return apiClient.get<AppointmentSettings>(BASE_PATH).then((res) => res.data)
  },

  updateSettings(request: AppointmentSettings) {
    return apiClient.put<AppointmentSettings>(BASE_PATH, request).then((res) => res.data)
  },
}
