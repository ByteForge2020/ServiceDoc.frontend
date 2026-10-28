import { useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Collapse from '@mui/material/Collapse'
import IconButton from '@mui/material/IconButton'
import TableCell from '@mui/material/TableCell'
import TableRow from '@mui/material/TableRow'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import { DateTime } from 'luxon'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { extractErrorMessage } from '../../../api/errorMessage'
import { useConfirm } from '../../../app/confirm/useConfirm'
import { useShopTimeZone } from '../../../app/shop/useShopTimeZone'
import { useToasters } from '../../../app/toasters/useToasters'
import { JobsCalendarDialog, type JobsCalendarDialogTarget } from '../../jobs/components/JobsCalendarDialog'
import { useDeleteJobMutation } from '../../jobs/queries'
import { bookingErrorMessage } from '../../serviceBayBookings/bookingErrorMessage'
import { useDeleteServiceBayBookingMutation } from '../../serviceBayBookings/queries'
import type { JobSummary, ServiceBayBookingSummary, WorkOrder } from '../types'
import { WorkOrderBookingTile } from './WorkOrderBookingTile'
import { WorkOrderJobTile } from './WorkOrderJobTile'

function formatDate(value: string | null, zone: string): string {
  if (!value) {
    return '—'
  }
  return DateTime.fromISO(value, { zone: 'utc' }).setZone(zone).toLocaleString(DateTime.DATETIME_MED)
}

// The "add" links above the tiles: plain text, no background or border.
const linkButtonSx = {
  alignSelf: 'flex-start',
  p: 0,
  minWidth: 0,
  fontWeight: 600,
  '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' },
} as const

const tileGridSx = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
  gap: 1.5,
} as const

interface WorkOrderRowProps {
  workOrder: WorkOrder
}

export function WorkOrderRow({ workOrder }: WorkOrderRowProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const zone = useShopTimeZone()
  const toasters = useToasters()
  const confirm = useConfirm()
  const deleteJobMutation = useDeleteJobMutation()
  const deleteBookingMutation = useDeleteServiceBayBookingMutation()
  const [open, setOpen] = useState(false)
  const [calendarTarget, setCalendarTarget] = useState<JobsCalendarDialogTarget | null>(null)

  const order = { id: workOrder.id, orderNumber: workOrder.orderNumber }

  async function handleDeleteBooking(booking: ServiceBayBookingSummary) {
    const confirmed = await confirm({
      message: t('serviceBayBookings.deleteConfirmMessage', { orderNumber: workOrder.orderNumber }),
      confirmLabel: t('serviceBayBookings.delete'),
      destructive: true,
    })

    if (!confirmed) {
      return
    }

    deleteBookingMutation.mutate(booking.id, {
      onSuccess: () => {
        toasters.success(t('serviceBayBookings.deleteSuccess'))
      },
      onError: (error) => {
        toasters.error(bookingErrorMessage(error, t('serviceBayBookings.deleteError')))
      },
    })
  }

  async function handleDeleteJob(job: JobSummary) {
    const confirmed = await confirm({
      message: t('jobs.jobCard.deleteConfirmMessage', { orderNumber: workOrder.orderNumber }),
      confirmLabel: t('jobs.jobCard.deleteJob'),
      destructive: true,
    })

    if (!confirmed) {
      return
    }

    deleteJobMutation.mutate(job.id, {
      onSuccess: () => {
        toasters.success(t('jobs.jobCard.deleteSuccess'))
      },
      onError: (error) => {
        toasters.error(extractErrorMessage(error, t('jobs.jobCard.deleteError')))
      },
    })
  }

  return (
    <>
      <TableRow hover onClick={() => navigate(`/orders/${workOrder.id}`)} sx={{ cursor: 'pointer' }}>
        <TableCell sx={{ width: 48 }}>
          <IconButton
            size="small"
            aria-label={open ? t('workOrders.table.collapseAria') : t('workOrders.table.expandAria')}
            onClick={(event) => {
              event.stopPropagation()
              setOpen((prev) => !prev)
            }}
          >
            <KeyboardArrowRightIcon
              fontSize="small"
              sx={{ transition: 'transform 0.2s', transform: open ? 'rotate(90deg)' : 'none' }}
            />
          </IconButton>
        </TableCell>
        <TableCell>{workOrder.orderNumber}</TableCell>
        <TableCell>
          <Chip size="small" label={workOrder.phaseName} />
        </TableCell>
        <TableCell>{workOrder.customerName ?? '—'}</TableCell>
        <TableCell>{workOrder.vehicleDescription ?? '—'}</TableCell>
        <TableCell>{workOrder.notes ?? '—'}</TableCell>
        <TableCell>{formatDate(workOrder.openedAt, zone)}</TableCell>
        <TableCell>{formatDate(workOrder.closedAt, zone)}</TableCell>
      </TableRow>

      {/* This row has no click handler of its own, so clicks inside the calendar dialog (rendered from here) can't
          bubble up to the row above and open the order. */}
      <TableRow>
        <TableCell sx={{ py: 0, bgcolor: 'action.hover', borderBottom: open ? undefined : 'none' }} colSpan={8}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ my: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Button
                variant="text"
                disableRipple
                onClick={() => setCalendarTarget({ kind: 'addJob', order })}
                sx={linkButtonSx}
              >
                {t('workOrders.jobsTable.addJob')}
              </Button>
              <Button
                variant="text"
                disableRipple
                onClick={() => setCalendarTarget({ kind: 'addBooking', order })}
                sx={linkButtonSx}
              >
                {t('workOrders.jobsTable.bookServiceBay')}
              </Button>

              {workOrder.jobs.length > 0 && (
                <Box sx={tileGridSx}>
                  {workOrder.jobs.map((job) => (
                    <WorkOrderJobTile
                      key={job.id}
                      job={job}
                      onEdit={(item) =>
                        setCalendarTarget({ kind: 'editJob', jobId: item.id, scheduledTime: item.scheduledTime })
                      }
                      onDelete={handleDeleteJob}
                    />
                  ))}
                </Box>
              )}

              {workOrder.serviceBayBookings.length > 0 && (
                <Box sx={tileGridSx}>
                  {workOrder.serviceBayBookings.map((booking) => (
                    <WorkOrderBookingTile
                      key={booking.id}
                      booking={booking}
                      onEdit={(item) =>
                        setCalendarTarget({ kind: 'editBooking', bookingId: item.id, scheduledTime: item.scheduledTime })
                      }
                      onDelete={handleDeleteBooking}
                    />
                  ))}
                </Box>
              )}
            </Box>
          </Collapse>

          {calendarTarget && <JobsCalendarDialog target={calendarTarget} onClose={() => setCalendarTarget(null)} />}
        </TableCell>
      </TableRow>
    </>
  )
}
