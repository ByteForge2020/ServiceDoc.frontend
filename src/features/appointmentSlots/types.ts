import type { CalendarEntry } from '../jobs/types'

export interface AppointmentSlotDescription {
  id: string
  /** Set when the description stands for one of the appointment's reasons, null for a custom text. Informational only. */
  estimateMasterListId: string | null
  name: string
}

/** What is sent for one description; the server fills in the id and, for a reason, its current name. */
export interface AppointmentSlotDescriptionPayload {
  id: string | null
  estimateMasterListId: string | null
  name: string
}

export interface AppointmentJob {
  id: string
  appointmentId: string
  appointmentNumber: string
  assignedUserId: string
  assignedUserName: string
  scheduledTime: string
  scheduledDurationMinutes: number
  descriptions: AppointmentSlotDescription[]
  createdAt: string
}

export interface CreateAppointmentJobPayload {
  appointmentId: string
  assignedUserId: string
  scheduledTime: string
  scheduledDurationMinutes: number
  descriptions: AppointmentSlotDescriptionPayload[]
}

export interface UpdateAppointmentJobPayload {
  appointmentId: string
  scheduledTime: string
  scheduledDurationMinutes: number
  descriptions: AppointmentSlotDescriptionPayload[]
}

export interface RescheduleAppointmentJobPayload {
  assignedUserId: string
  scheduledTime: string
}

export interface AppointmentServiceBayBooking {
  id: string
  appointmentId: string
  appointmentNumber: string
  serviceBayId: string
  serviceBayName: string
  scheduledTime: string
  scheduledDurationMinutes: number
  descriptions: AppointmentSlotDescription[]
  createdAt: string
}

export interface CreateAppointmentServiceBayBookingPayload {
  appointmentId: string
  serviceBayId: string
  scheduledTime: string
  scheduledDurationMinutes: number
  descriptions: AppointmentSlotDescriptionPayload[]
}

export interface UpdateAppointmentServiceBayBookingPayload {
  appointmentId: string
  scheduledTime: string
  scheduledDurationMinutes: number
  descriptions: AppointmentSlotDescriptionPayload[]
}

export interface RescheduleAppointmentServiceBayBookingPayload {
  serviceBayId: string
  scheduledTime: string
}

export function appointmentJobToCalendarEntry(job: AppointmentJob): CalendarEntry {
  return {
    id: job.id,
    kind: 'appointment',
    parentId: job.appointmentId,
    parentNumber: job.appointmentNumber,
    rowId: job.assignedUserId,
    scheduledTime: job.scheduledTime,
    scheduledDurationMinutes: job.scheduledDurationMinutes,
    descriptions: job.descriptions,
  }
}

export function appointmentBookingToCalendarEntry(booking: AppointmentServiceBayBooking): CalendarEntry {
  return {
    id: booking.id,
    kind: 'appointment',
    parentId: booking.appointmentId,
    parentNumber: booking.appointmentNumber,
    rowId: booking.serviceBayId,
    scheduledTime: booking.scheduledTime,
    scheduledDurationMinutes: booking.scheduledDurationMinutes,
    descriptions: booking.descriptions,
  }
}
