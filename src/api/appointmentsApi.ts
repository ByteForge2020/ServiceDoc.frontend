import { apiClient } from './apiClient'
import type { Appointment, CreateAppointmentRequest, UpdateAppointmentRequest } from '../features/appointments/types'

const BASE_PATH = '/api/v1/general/appointments'

export const appointmentsApi = {
  getAll(from: string, to: string) {
    return apiClient.get<Appointment[]>(BASE_PATH, { params: { from, to } }).then((res) => res.data)
  },

  getById(id: string) {
    return apiClient.get<Appointment>(`${BASE_PATH}/${id}`).then((res) => res.data)
  },

  create(request: CreateAppointmentRequest) {
    return apiClient.post<Appointment>(BASE_PATH, request).then((res) => res.data)
  },

  update(id: string, request: UpdateAppointmentRequest) {
    return apiClient.put<Appointment>(`${BASE_PATH}/${id}`, request).then((res) => res.data)
  },

  delete(id: string) {
    return apiClient.delete<void>(`${BASE_PATH}/${id}`).then((res) => res.data)
  },

  convertToWorkOrder(id: string) {
    return apiClient.post<Appointment>(`${BASE_PATH}/${id}/convert`).then((res) => res.data)
  },
}
