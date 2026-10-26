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
import type { WorkOrderSummary } from '../../workOrders/types'
import type { CalendarMode } from '../types'
import { JobsCalendar } from './JobsCalendar'

/** What the dialog is opened for: scheduling a new job for an order, or editing one existing job. */
export type JobsCalendarDialogTarget =
  | { kind: 'addToOrder'; order: WorkOrderSummary }
  | { kind: 'editJob'; jobId: string; scheduledTime: string }

interface JobsCalendarDialogProps {
  target: JobsCalendarDialogTarget
  onClose: () => void
}

// Header, date row, tabs and paddings around the grid; the grid takes the rest of the dialog's height.
const CHROME_HEIGHT = '270px'

/**
 * The job calendar in a large dialog, opened from a work order. It keeps its own date, so browsing it never moves
 * the date of the Jobs screen. Saving or deleting a job closes it.
 */
export function JobsCalendarDialog({ target, onClose }: JobsCalendarDialogProps) {
  const { t } = useTranslation()
  const toasters = useToasters()
  const zone = useShopTimeZone()
  const theme = useTheme()
  const isNarrow = useMediaQuery(theme.breakpoints.down('md'))

  const [selectedDate, setSelectedDate] = useState(() =>
    target.kind === 'editJob'
      ? DateTime.fromISO(target.scheduledTime, { zone: 'utc' }).setZone(zone).toISODate()!
      : DateTime.now().setZone(zone).toISODate()!,
  )

  const mode: CalendarMode =
    target.kind === 'addToOrder'
      ? { kind: 'addToOrder', order: target.order }
      : { kind: 'editJob', jobId: target.jobId }

  function handleFocusJobMissing() {
    toasters.error(t('jobs.calendarDialog.jobNotFound'))
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
          mode={mode}
          maxHeight={`calc(${isNarrow ? '100vh' : '85vh'} - ${CHROME_HEIGHT})`}
          onJobCreated={onClose}
          onJobUpdated={onClose}
          onJobDeleted={onClose}
          onFocusJobMissing={handleFocusJobMissing}
        />
      </DialogContent>
    </Dialog>
  )
}
