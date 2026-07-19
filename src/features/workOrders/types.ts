export type WorkOrderStatus = 'Draft' | 'Open' | 'InProgress' | 'Completed' | 'Cancelled'

export interface WorkOrder {
  id: string
  repairShopId: string
  customerId: string
  vehicleId: string
  status: WorkOrderStatus
  notes: string | null
  openedAt: string
  closedAt: string | null
  createdAt: string
}
