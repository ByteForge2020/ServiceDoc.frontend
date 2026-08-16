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

export type EstimateStatus = 'Draft' | 'Approved' | 'Rejected'

export interface EstimateItemPayload {
  subItem: boolean
  name: string
  partNumber: string | null
  partQty: number | null
  availQty: number | null
  partCostU: number | null
  partPriceU: number | null
  hours: number | null
  priceHr: number | null
  discount: number | null
  total: number | null
}

export interface EstimateItem extends EstimateItemPayload {
  id: string
  sortOrder: number
}

export interface Estimate {
  id: string
  status: EstimateStatus
  sortOrder: number
  items: EstimateItem[]
}

export interface EstimatePayload {
  id: string | null
  status: EstimateStatus
  items: EstimateItemPayload[]
}

export interface CreateWorkOrderRequest {
  orderNumber: string
  notes: string | null
  customer: CustomerPayload | null
  vehicle: VehiclePayload | null
  estimates: EstimatePayload[]
}

export interface UpdateWorkOrderRequest {
  orderNumber: string
  status: WorkOrderStatus
  notes: string | null
  closedAt: string | null
  customer: CustomerPayload | null
  vehicle: VehiclePayload | null
  estimates: EstimatePayload[]
}

export interface JobSummary {
  id: string
  estimateItemName: string | null
  assignedUserName: string
  scheduledTime: string
  scheduledDurationMinutes: number
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
  estimates: Estimate[]
  jobs: JobSummary[]
}

export interface WorkOrderSummary {
  id: string
  orderNumber: string
}
