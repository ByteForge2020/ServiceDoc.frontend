import { apiClient } from './apiClient'

const BASE_PATH = '/api/v1/general/shop/appointment-settings'
const WORK_SCHEDULE_PATH = '/api/v1/general/shop/work-schedule'

export interface DaySchedule {
  dayOfWeek: number
  isEnabled: boolean
  openingTimeMinutes: number
  closingTimeMinutes: number
}

/** What the calendars schedule by: the default appointment length and the shop's working hours. */
export interface AppointmentSettings {
  defaultAppointmentDurationMinutes: number
  schedule: DaySchedule[]
}

export const appointmentSettingsApi = {
  getSettings() {
    return apiClient.get<AppointmentSettings>(BASE_PATH).then((res) => res.data)
  },

  /** Changes the default appointment length only; the working hours are saved with `updateWorkSchedule`. */
  updateSettings(defaultAppointmentDurationMinutes: number) {
    return apiClient
      .put<AppointmentSettings>(BASE_PATH, { defaultAppointmentDurationMinutes })
      .then((res) => res.data)
  },

  updateWorkSchedule(schedule: DaySchedule[]) {
    return apiClient.put<AppointmentSettings>(WORK_SCHEDULE_PATH, { schedule }).then((res) => res.data)
  },
}
