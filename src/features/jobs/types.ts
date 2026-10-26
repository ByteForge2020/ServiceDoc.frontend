import type { WorkOrderSummary } from '../workOrders/types'

/**
 * How the job calendar behaves: `free` is the Jobs screen (everything can be edited and dragged); `addToOrder` is the
 * calendar opened from a work order to schedule a job for it (the order is fixed, every existing job is locked);
 * `editJob` is the calendar opened to edit one job (it stays editable, every other job is locked).
 */
export type CalendarMode =
  | { kind: 'free' }
  | { kind: 'addToOrder'; order: WorkOrderSummary }
  | { kind: 'editJob'; jobId: string }

export const FREE_MODE: CalendarMode = { kind: 'free' }

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
