import type { WorkOrderSummary } from '../workOrders/types'

/**
 * How a calendar (technicians or service bays) behaves: `free` is the Jobs screen (everything can be edited and
 * dragged); `addToOrder` is the calendar opened from a work order to schedule something for it (the order is fixed,
 * every existing entry is locked); `editEntry` is the calendar opened to edit one entry (it stays editable, every
 * other entry is locked).
 */
export type CalendarMode =
  | { kind: 'free' }
  | { kind: 'addToOrder'; order: WorkOrderSummary }
  | { kind: 'editEntry'; entryId: string }

export const FREE_MODE: CalendarMode = { kind: 'free' }

/** What every calendar tab (technicians, service bays) takes. */
export interface CalendarTabProps {
  selectedDate: string
  /** Called when a dragged entry rests at a screen edge: moves the calendar one day back (-1) or forward (1). */
  onShiftDate: (direction: -1 | 1) => void
  mode?: CalendarMode
  /** Height the grid may grow to before it scrolls; defaults to a full page. */
  maxHeight?: string
  onCreated?: () => void
  onUpdated?: () => void
  onDeleted?: () => void
  /** In `editEntry` mode: the entry to edit can't be shown (deleted, or its row is gone). */
  onFocusMissing?: () => void
}

/** A row of a calendar grid: a technician, or a service bay. */
export interface CalendarRow {
  id: string
  name: string
}

/** What the calendar draws: a job (row = its technician) or a service bay booking (row = its bay). */
export interface CalendarEntry {
  id: string
  orderId: string
  orderNumber: string
  rowId: string
  scheduledTime: string
  scheduledDurationMinutes: number
  descriptions: JobDescription[]
}

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

export function jobToCalendarEntry(job: Job): CalendarEntry {
  return {
    id: job.id,
    orderId: job.orderId,
    orderNumber: job.orderNumber,
    rowId: job.assignedUserId,
    scheduledTime: job.scheduledTime,
    scheduledDurationMinutes: job.scheduledDurationMinutes,
    descriptions: job.descriptions,
  }
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
