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
}

export interface CreateAppointmentRequest {
  number: string
  customer: CustomerPayload | null
  vehicle: VehiclePayload | null
  reasonIds: string[]
  scheduledTime: string
  durationMinutes: number
}

export interface UpdateAppointmentRequest {
  number: string
  status: AppointmentStatus
  customer: CustomerPayload | null
  vehicle: VehiclePayload | null
  reasonIds: string[]
  scheduledTime: string
  durationMinutes: number
}
