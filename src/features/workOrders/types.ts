import type { EstimateType } from '../../api/estimateMasterListApi'
import type { DiscountType } from '../../app/shop/shopApi'
import type { Customer } from '../customers/types'
import type { Vehicle } from '../vehicles/types'

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
  id: string | null
  subItem: boolean
  name: string
  type: EstimateType
  hours: number | null
  priceHr: number | null
  /** Price of one unit. Only read for a Fixed item; an Hourly item's price is hours x rate. */
  price: number | null
  /** Whole number, at least 1. */
  quantity: number
  /** Greater than 0, one decimal place; multiplies the amount. */
  complexity: number
  /** A percent or a money amount, depending on the work order's discountType. */
  discount: number | null
  /** Tax amount, a snapshot from when the item was added; null when there was none. */
  tax: number | null
}

export interface EstimateItem extends EstimateItemPayload {
  id: string
  sortOrder: number
  /** Calculated by the server: price x quantity x complexity minus the discount. Never sent back. */
  total: number | null
  /** Scheduled jobs that point at this item; removing the item removes them too. */
  jobCount: number
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

export interface SparePartPayload {
  /** Id of a saved product so the server updates it in place; null for a new product. */
  id: string | null
  name: string
  partNumber: string | null
  qty: number | null
  availQty: number | null
  costU: number | null
  priceU: number | null
}

export interface SparePart extends SparePartPayload {
  id: string
  sortOrder: number
}

export interface CreateWorkOrderRequest {
  orderNumber: string
  phaseId: string | null
  notes: string | null
  customer: CustomerPayload | null
  vehicle: VehiclePayload | null
  estimates: EstimatePayload[]
  spareParts: SparePartPayload[]
}

export interface UpdateWorkOrderRequest {
  orderNumber: string
  phaseId: string | null
  notes: string | null
  closedAt: string | null
  customer: CustomerPayload | null
  vehicle: VehiclePayload | null
  estimates: EstimatePayload[]
  spareParts: SparePartPayload[]
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
  phaseId: string
  phaseName: string
  notes: string | null
  openedAt: string
  closedAt: string | null
  createdAt: string
  /** The shop's discount type when the order was created; applies to every item's discount. */
  discountType: DiscountType
  estimates: Estimate[]
  spareParts: SparePart[]
  jobs: JobSummary[]
}

export interface WorkOrderSummary {
  id: string
  orderNumber: string
}
