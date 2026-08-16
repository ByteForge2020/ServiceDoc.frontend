export interface Job {
  id: string
  orderId: string
  orderNumber: string
  assignedUserId: string
  assignedUserName: string
  scheduledTime: string
  scheduledDurationMinutes: number
  estimateItemId: string | null
  estimateItemName: string | null
  createdAt: string
}

export interface CreateJobPayload {
  orderId: string
  assignedUserId: string
  scheduledTime: string
  scheduledDurationMinutes: number
  estimateItemId: string | null
}

export interface UpdateJobPayload {
  orderId: string
  scheduledTime: string
  scheduledDurationMinutes: number
  estimateItemId: string | null
}
