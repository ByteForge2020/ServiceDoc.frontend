import type { Customer } from '../customers/types'
import type { Vehicle } from '../vehicles/types'
import type { CustomerPayload, VehiclePayload } from '../workOrders/types'

export type AppointmentStatus = 'Scheduled' | 'Arrived' | 'NoShow'

export interface AppointmentReason {
  id: string
  name: string
}

export interface Appointment {
  id: string
  repairShopId: string
  number: string
  status: AppointmentStatus
  customerId: string | null
  customerName: string | null
  customer: Customer | null
  vehicleId: string | null
  vehicleDescription: string | null
  vehicle: Vehicle | null
  reasons: AppointmentReason[]
  scheduledTime: string
  durationMinutes: number
  convertedWorkOrderId: string | null
  convertedOrderNumber: string | null
  createdAt: string
  /** Employee time booked for the appointment; becomes the work order's jobs when it is converted. */
  jobs: AppointmentJobSummary[]
  /** Service bays booked for the appointment; become the work order's bookings when it is converted. */
  serviceBayBookings: AppointmentServiceBayBookingSummary[]
}

export interface AppointmentJobSummary {
  id: string
  descriptions: string[]
  assignedUserName: string
  scheduledTime: string
  scheduledDurationMinutes: number
}

export interface AppointmentServiceBayBookingSummary {
  id: string
  serviceBayName: string
  isServiceBayDeleted: boolean
  descriptions: string[]
  scheduledTime: string
  scheduledDurationMinutes: number
}

/** An appointment as offered when choosing which one to book time for (the picker, or the fixed appointment of a calendar). */
export interface AppointmentSummary {
  id: string
  number: string
  customerName: string | null
  vehicleDescription: string | null
  scheduledTime: string
  durationMinutes: number
  reasons: AppointmentReason[]
}

export interface CreateAppointmentRequest {
  number: string
  customer: CustomerPayload | null
  vehicle: VehiclePayload | null
  estimateMasterListIds: string[]
  scheduledTime: string
  durationMinutes: number
}

export interface UpdateAppointmentRequest {
  number: string
  status: AppointmentStatus
  customer: CustomerPayload | null
  vehicle: VehiclePayload | null
  estimateMasterListIds: string[]
  scheduledTime: string
  durationMinutes: number
}
