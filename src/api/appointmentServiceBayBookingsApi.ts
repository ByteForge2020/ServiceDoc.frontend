import { apiClient } from './apiClient'
import type {
  AppointmentServiceBayBooking,
  CreateAppointmentServiceBayBookingPayload,
  RescheduleAppointmentServiceBayBookingPayload,
  UpdateAppointmentServiceBayBookingPayload,
} from '../features/appointmentSlots/types'

const BASE_PATH = '/api/v1/general/appointmentservicebaybookings'

export const appointmentServiceBayBookingsApi = {
  getAll(from: string, to: string) {
    return apiClient.get<AppointmentServiceBayBooking[]>(BASE_PATH, { params: { from, to } }).then((res) => res.data)
  },

  create(payload: CreateAppointmentServiceBayBookingPayload) {
    return apiClient.post<AppointmentServiceBayBooking>(BASE_PATH, payload).then((res) => res.data)
  },

  update(id: string, payload: UpdateAppointmentServiceBayBookingPayload) {
    return apiClient.put<AppointmentServiceBayBooking>(`${BASE_PATH}/${id}`, payload).then((res) => res.data)
  },

  reschedule(id: string, payload: RescheduleAppointmentServiceBayBookingPayload) {
    return apiClient
      .patch<AppointmentServiceBayBooking>(`${BASE_PATH}/${id}/schedule`, payload)
      .then((res) => res.data)
  },

  delete(id: string) {
    return apiClient.delete<void>(`${BASE_PATH}/${id}`).then((res) => res.data)
  },
}
