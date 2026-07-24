import type { Customer } from '../customers/types'
import type { Vehicle } from '../vehicles/types'

export type WorkOrderStatus = 'Draft' | 'Open' | 'InProgress' | 'Completed' | 'Cancelled'

export interface CustomerPayload {
  customerId: string | null
  firstName: string | null
  lastName: string | null
  email: string | null
  phone: string | null
}

export interface VehiclePayload {
  vehicleId: string | null
  brandId: string | null
  modelId: string | null
  year: number | null
  vin: string | null
  licensePlate: string | null
  mileage: number | null
}

export interface CreateWorkOrderRequest {
  orderNumber: string
  notes: string | null
  customer: CustomerPayload | null
  vehicle: VehiclePayload | null
}

export interface UpdateWorkOrderRequest {
  orderNumber: string
  status: WorkOrderStatus
  notes: string | null
  closedAt: string | null
  customer: CustomerPayload | null
  vehicle: VehiclePayload | null
}

export interface WorkOrder {
  id: string
  repairShopId: string
  orderNumber: string
  customerId: string | null
  customerName: string | null
  customer: Customer | null
  vehicleId: string | null
  vehicleDescription: string | null
  vehicle: Vehicle | null
  status: WorkOrderStatus
  notes: string | null
  openedAt: string
  closedAt: string | null
  createdAt: string
}
