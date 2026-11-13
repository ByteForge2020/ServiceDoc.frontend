import type { AppointmentSummary } from '../appointments/types'
import type { WorkOrderSummary } from '../workOrders/types'

/** What time is booked for: a work order (firm), or an appointment (only planned until it becomes a work order). */
export type SlotParentKind = 'order' | 'appointment'

export interface SlotParent {
  kind: SlotParentKind
  id: string
  /** The work order's or appointment's number. */
  number: string
}

export function orderParent(order: Pick<WorkOrderSummary, 'id' | 'orderNumber'>): SlotParent {
  return { kind: 'order', id: order.id, number: order.orderNumber }
}

export function appointmentParent(appointment: Pick<AppointmentSummary, 'id' | 'number'>): SlotParent {
  return { kind: 'appointment', id: appointment.id, number: appointment.number }
}
