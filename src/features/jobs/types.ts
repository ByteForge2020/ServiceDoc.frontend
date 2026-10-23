export interface JobDescription {
  id: string
  /** Set when the description was picked from the order's services, null for a custom text. Informational only. */
  estimateItemId: string | null
  name: string
}

/** What is sent for one description; the server fills in the id and, for a service, its current name. */
export interface JobDescriptionPayload {
  id: string | null
  estimateItemId: string | null
  name: string
}

export interface Job {
  id: string
  orderId: string
  orderNumber: string
  assignedUserId: string
  assignedUserName: string
  scheduledTime: string
  scheduledDurationMinutes: number
  descriptions: JobDescription[]
  createdAt: string
}

export interface CreateJobPayload {
  orderId: string
  assignedUserId: string
  scheduledTime: string
  scheduledDurationMinutes: number
  descriptions: JobDescriptionPayload[]
}

export interface RescheduleJobPayload {
  assignedUserId: string
  scheduledTime: string
}

export interface UpdateJobPayload {
  orderId: string
  scheduledTime: string
  scheduledDurationMinutes: number
  descriptions: JobDescriptionPayload[]
}
