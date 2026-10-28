import { apiClient } from './apiClient'
import type {
  CreateServiceBayBookingPayload,
  RescheduleServiceBayBookingPayload,
  ServiceBayBooking,
  UpdateServiceBayBookingPayload,
} from '../features/serviceBayBookings/types'

const BASE_PATH = '/api/v1/general/servicebaybookings'

export const serviceBayBookingsApi = {
  getAll(from: string, to: string) {
    return apiClient.get<ServiceBayBooking[]>(BASE_PATH, { params: { from, to } }).then((res) => res.data)
  },

  create(payload: CreateServiceBayBookingPayload) {
    return apiClient.post<ServiceBayBooking>(BASE_PATH, payload).then((res) => res.data)
  },

  update(id: string, payload: UpdateServiceBayBookingPayload) {
    return apiClient.put<ServiceBayBooking>(`${BASE_PATH}/${id}`, payload).then((res) => res.data)
  },

  reschedule(id: string, payload: RescheduleServiceBayBookingPayload) {
    return apiClient.patch<ServiceBayBooking>(`${BASE_PATH}/${id}/schedule`, payload).then((res) => res.data)
  },

  delete(id: string) {
    return apiClient.delete<void>(`${BASE_PATH}/${id}`).then((res) => res.data)
  },
}
