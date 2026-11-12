import { useState } from 'react'
import CloseIcon from '@mui/icons-material/Close'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { DateTime } from 'luxon'
import { useTranslation } from 'react-i18next'
import { useShopTimeZone } from '../../../app/shop/useShopTimeZone'
import { useToasters } from '../../../app/toasters/useToasters'
import type { AppointmentSummary } from '../../appointments/types'
import type { WorkOrderSummary } from '../../workOrders/types'
import type { CalendarMode } from '../types'
import type { CalendarTabKey } from '../types'
import { JobsCalendar } from './JobsCalendar'

/**
 * What the dialog is opened for: scheduling a new job or booking a service bay for an order or an appointment, or
 * editing one existing job or booking.
 */
export type JobsCalendarDialogTarget =
  | { kind: 'addJob'; order: WorkOrderSummary }
  | { kind: 'editJob'; jobId: string; scheduledTime: string }
  | { kind: 'addBooking'; order: WorkOrderSummary }
  | { kind: 'editBooking'; bookingId: string; scheduledTime: string }
  | { kind: 'addAppointmentJob'; appointment: AppointmentSummary }
  | { kind: 'editAppointmentJob'; jobId: string; scheduledTime: string }
  | { kind: 'addAppointmentBooking'; appointment: AppointmentSummary }
  | { kind: 'editAppointmentBooking'; bookingId: string; scheduledTime: string }

type EditTarget = Extract<
  JobsCalendarDialogTarget,
  { kind: 'editJob' | 'editBooking' | 'editAppointmentJob' | 'editAppointmentBooking' }
>

function isEditTarget(target: JobsCalendarDialogTarget): target is EditTarget {
  return (
    target.kind === 'editJob' ||
    target.kind === 'editBooking' ||
    target.kind === 'editAppointmentJob' ||
    target.kind === 'editAppointmentBooking'
  )
}

interface JobsCalendarDialogProps {
  target: JobsCalendarDialogTarget
  onClose: () => void
}

// Header, date row, tabs and paddings around the grid; the grid takes the rest of the dialog's height.
const CHROME_HEIGHT = '270px'

function targetTab(target: JobsCalendarDialogTarget): CalendarTabKey {
  switch (target.kind) {
    case 'addBooking':
    case 'editBooking':
    case 'addAppointmentBooking':
    case 'editAppointmentBooking':
      return 'serviceBays'
    default:
      return 'technicians'
  }
}

function targetMode(target: JobsCalendarDialogTarget): CalendarMode {
  switch (target.kind) {
    case 'addJob':
    case 'addBooking':
      return { kind: 'addToOrder', order: target.order }
    case 'addAppointmentJob':
    case 'addAppointmentBooking':
      return { kind: 'addToAppointment', appointment: target.appointment }
    case 'editJob':
    case 'editAppointmentJob':
      return { kind: 'editEntry', entryId: target.jobId }
    case 'editBooking':
    case 'editAppointmentBooking':
      return { kind: 'editEntry', entryId: target.bookingId }
  }
}

/**
 * The calendar in a large dialog, opened from a work order or an appointment. It keeps its own date, so browsing it never moves
 * the date of the Jobs screen. Saving or deleting an entry closes it.
 */
export function JobsCalendarDialog({ target, onClose }: JobsCalendarDialogProps) {
  const { t } = useTranslation()
  const toasters = useToasters()
  const zone = useShopTimeZone()
  const theme = useTheme()
  const isNarrow = useMediaQuery(theme.breakpoints.down('md'))

  const [selectedDate, setSelectedDate] = useState(() =>
    isEditTarget(target)
      ? DateTime.fromISO(target.scheduledTime, { zone: 'utc' }).setZone(zone).toISODate()!
      : DateTime.now().setZone(zone).toISODate()!,
  )

  function handleFocusMissing() {
    toasters.error(t('jobs.calendarDialog.entryNotFound'))
    onClose()
  }

  return (
    <Dialog
      open
      onClose={onClose}
      fullScreen={isNarrow}
      maxWidth={false}
      slotProps={{
        paper: { sx: isNarrow ? undefined : { width: '85vw', height: '85vh', borderRadius: '12px' } },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {t('jobs.title')}
        <IconButton onClick={onClose} size="small" aria-label={t('jobs.calendarDialog.closeAria')}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <JobsCalendar
          selectedDate={selectedDate}
          onSelectedDateChange={setSelectedDate}
          onShiftDate={(direction) =>
            setSelectedDate((current) =>
              DateTime.fromISO(current, { zone: 'utc' }).plus({ days: direction }).toISODate()!,
            )
          }
          lockedTab={targetTab(target)}
          mode={targetMode(target)}
          maxHeight={`calc(${isNarrow ? '100vh' : '85vh'} - ${CHROME_HEIGHT})`}
          onCreated={onClose}
          onUpdated={onClose}
          onDeleted={onClose}
          onFocusMissing={handleFocusMissing}
        />
      </DialogContent>
    </Dialog>
  )
}
