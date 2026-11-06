import { apiClient } from './apiClient'
import type {
  AppointmentJob,
  CreateAppointmentJobPayload,
  RescheduleAppointmentJobPayload,
  UpdateAppointmentJobPayload,
} from '../features/appointmentSlots/types'

const BASE_PATH = '/api/v1/general/appointmentjobs'

export const appointmentJobsApi = {
  getAll(from: string, to: string) {
    return apiClient.get<AppointmentJob[]>(BASE_PATH, { params: { from, to } }).then((res) => res.data)
  },

  create(payload: CreateAppointmentJobPayload) {
    return apiClient.post<AppointmentJob>(BASE_PATH, payload).then((res) => res.data)
  },

  update(id: string, payload: UpdateAppointmentJobPayload) {
    return apiClient.put<AppointmentJob>(`${BASE_PATH}/${id}`, payload).then((res) => res.data)
  },

  reschedule(id: string, payload: RescheduleAppointmentJobPayload) {
    return apiClient.patch<AppointmentJob>(`${BASE_PATH}/${id}/schedule`, payload).then((res) => res.data)
  },

  delete(id: string) {
    return apiClient.delete<void>(`${BASE_PATH}/${id}`).then((res) => res.data)
  },
}
