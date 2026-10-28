import type { CalendarEntry, JobDescription, JobDescriptionPayload } from '../jobs/types'

export interface ServiceBayBooking {
  id: string
  orderId: string
  orderNumber: string
  serviceBayId: string
  serviceBayName: string
  scheduledTime: string
  scheduledDurationMinutes: number
  descriptions: JobDescription[]
  createdAt: string
}

export interface CreateServiceBayBookingPayload {
  orderId: string
  serviceBayId: string
  scheduledTime: string
  scheduledDurationMinutes: number
  descriptions: JobDescriptionPayload[]
}

export interface UpdateServiceBayBookingPayload {
  orderId: string
  scheduledTime: string
  scheduledDurationMinutes: number
  descriptions: JobDescriptionPayload[]
}

export interface RescheduleServiceBayBookingPayload {
  serviceBayId: string
  scheduledTime: string
}

export function bookingToCalendarEntry(booking: ServiceBayBooking): CalendarEntry {
  return {
    id: booking.id,
    orderId: booking.orderId,
    orderNumber: booking.orderNumber,
    rowId: booking.serviceBayId,
    scheduledTime: booking.scheduledTime,
    scheduledDurationMinutes: booking.scheduledDurationMinutes,
    descriptions: booking.descriptions,
  }
}
