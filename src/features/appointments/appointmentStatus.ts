import type { ChipProps } from '@mui/material/Chip'
import type { AppointmentStatus } from './types'

export const APPOINTMENT_STATUS_COLOR: Record<AppointmentStatus, NonNullable<ChipProps['color']>> = {
  Scheduled: 'warning',
  Arrived: 'success',
  NoShow: 'error',
}

export const APPOINTMENT_STATUS_LABEL_KEY: Record<AppointmentStatus, string> = {
  Scheduled: 'appointmentsPage.status.scheduled',
  Arrived: 'appointmentsPage.status.arrived',
  NoShow: 'appointmentsPage.status.noShow',
}
