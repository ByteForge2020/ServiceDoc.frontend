import { useState, type ReactNode } from 'react'
import CarRepairIcon from '@mui/icons-material/CarRepair'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined'
import ScheduleIcon from '@mui/icons-material/Schedule'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { extractErrorMessage } from '../../../api/errorMessage'
import { useConfirm } from '../../../app/confirm/useConfirm'
import { useShopTimeZone } from '../../../app/shop/useShopTimeZone'
import { useToasters } from '../../../app/toasters/useToasters'
import { formatScheduledRange } from '../../../utils/timeGrid'
import {
  useDeleteAppointmentJobMutation,
  useDeleteAppointmentServiceBayBookingMutation,
} from '../../appointmentSlots/queries'
import { JobsCalendarDialog, type JobsCalendarDialogTarget } from '../../jobs/components/JobsCalendarDialog'
import type { Appointment, AppointmentSummary } from '../types'

const linkButtonSx = { alignSelf: 'flex-start', px: 0, py: 0, minWidth: 'auto' }

interface AppointmentPlannedWorkProps {
  appointment: Appointment
}

/**
 * The employee time and service bays booked for an appointment, with the buttons to book more. Booking opens the
 * calendar for the appointment; when the appointment is converted, all of this becomes the work order's.
 */
export function AppointmentPlannedWork({ appointment }: AppointmentPlannedWorkProps) {
  const { t } = useTranslation()
  const toasters = useToasters()
  const confirm = useConfirm()
  const [calendarTarget, setCalendarTarget] = useState<JobsCalendarDialogTarget | null>(null)
  const deleteJobMutation = useDeleteAppointmentJobMutation()
  const deleteBookingMutation = useDeleteAppointmentServiceBayBookingMutation()

  const isConverted = !!appointment.convertedWorkOrderId
  const hasWork = appointment.jobs.length > 0 || appointment.serviceBayBookings.length > 0

  // A converted appointment's slots are the work order's now, so there is nothing to show or add here.
  if (isConverted && !hasWork) {
    return null
  }

  const summary: AppointmentSummary = {
    id: appointment.id,
    number: appointment.number,
    customerName: appointment.customerName,
    vehicleDescription: appointment.vehicleDescription,
    scheduledTime: appointment.scheduledTime,
    durationMinutes: appointment.durationMinutes,
    reasons: appointment.reasons,
  }

  async function handleDelete(isBooking: boolean, id: string) {
    const confirmed = await confirm({
      message: t(isBooking ? 'appointmentSlots.bookings.deleteConfirmMessage' : 'appointmentSlots.jobs.deleteConfirmMessage', {
        number: appointment.number,
      }),
      confirmLabel: t(isBooking ? 'serviceBayBookings.delete' : 'jobs.jobCard.deleteJob'),
      destructive: true,
    })

    if (!confirmed) {
      return
    }

    const mutation = isBooking ? deleteBookingMutation : deleteJobMutation

    mutation.mutate(id, {
      onSuccess: () => {
        toasters.success(t(isBooking ? 'serviceBayBookings.deleteSuccess' : 'jobs.jobCard.deleteSuccess'))
      },
      onError: (error) => {
        toasters.error(extractErrorMessage(error, t(isBooking ? 'serviceBayBookings.deleteError' : 'jobs.jobCard.deleteError')))
      },
    })
  }

  return (
    <Stack spacing={1.5}>
      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
        {t('appointmentsPage.details.plannedWork.title')}
      </Typography>

      {!isConverted && (
        <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
          <Button
            variant="text"
            disableRipple
            onClick={() => setCalendarTarget({ kind: 'addAppointmentJob', appointment: summary })}
            sx={linkButtonSx}
          >
            {t('appointmentsPage.details.plannedWork.addJob')}
          </Button>
          <Button
            variant="text"
            disableRipple
            onClick={() => setCalendarTarget({ kind: 'addAppointmentBooking', appointment: summary })}
            sx={linkButtonSx}
          >
            {t('appointmentsPage.details.plannedWork.bookServiceBay')}
          </Button>
        </Stack>
      )}

      {!hasWork && (
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('appointmentsPage.details.plannedWork.empty')}
        </Typography>
      )}

      {appointment.jobs.map((job) => (
        <WorkTile
          key={job.id}
          icon={<PersonOutlinedIcon sx={{ fontSize: 20, color: 'appointment.main', flexShrink: 0 }} />}
          title={job.assignedUserName}
          descriptions={job.descriptions}
          scheduledTime={job.scheduledTime}
          durationMinutes={job.scheduledDurationMinutes}
          menuAria={t('jobs.jobCard.menuAria')}
          editLabel={t('jobs.jobCard.editJob')}
          deleteLabel={t('jobs.jobCard.deleteJob')}
          readOnly={isConverted}
          onEdit={() => setCalendarTarget({ kind: 'editAppointmentJob', jobId: job.id, scheduledTime: job.scheduledTime })}
          onDelete={() => handleDelete(false, job.id)}
        />
      ))}

      {appointment.serviceBayBookings.map((booking) => (
        <WorkTile
          key={booking.id}
          icon={<CarRepairIcon sx={{ fontSize: 20, color: 'appointment.main', flexShrink: 0 }} />}
          title={booking.serviceBayName}
          deletedBadge={booking.isServiceBayDeleted ? t('serviceBayBookings.deletedBay') : undefined}
          descriptions={booking.descriptions}
          scheduledTime={booking.scheduledTime}
          durationMinutes={booking.scheduledDurationMinutes}
          menuAria={t('serviceBayBookings.menuAria')}
          editLabel={t('serviceBayBookings.edit')}
          deleteLabel={t('serviceBayBookings.delete')}
          readOnly={isConverted}
          // A deleted bay is not in the calendar, so there is nowhere to edit the booking: only deleting is offered.
          editDisabled={booking.isServiceBayDeleted}
          onEdit={() =>
            setCalendarTarget({
              kind: 'editAppointmentBooking',
              bookingId: booking.id,
              scheduledTime: booking.scheduledTime,
            })
          }
          onDelete={() => handleDelete(true, booking.id)}
        />
      ))}

      {calendarTarget && <JobsCalendarDialog target={calendarTarget} onClose={() => setCalendarTarget(null)} />}
    </Stack>
  )
}

interface WorkTileProps {
  icon: ReactNode
  title: string
  deletedBadge?: string
  descriptions: string[]
  scheduledTime: string
  durationMinutes: number
  menuAria: string
  editLabel: string
  deleteLabel: string
  readOnly: boolean
  editDisabled?: boolean
  onEdit: () => void
  onDelete: () => void
}

/** One piece of work booked for the appointment: dashed accent like the appointment's entries in the calendar. */
function WorkTile({
  icon,
  title,
  deletedBadge,
  descriptions,
  scheduledTime,
  durationMinutes,
  menuAria,
  editLabel,
  deleteLabel,
  readOnly,
  editDisabled = false,
  onEdit,
  onDelete,
}: WorkTileProps) {
  const { t } = useTranslation()
  const zone = useShopTimeZone()
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)

  return (
    <Box
      sx={{
        position: 'relative',
        p: 1.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderLeft: '3px dashed',
        borderLeftColor: 'appointment.main',
        borderRadius: '8px',
      }}
    >
      {!readOnly && (
        <IconButton
          size="small"
          aria-label={menuAria}
          onClick={(event) => setMenuAnchor(event.currentTarget)}
          sx={{ position: 'absolute', top: 4, right: 4 }}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 4, minWidth: 0 }}>
        {icon}
        <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        {deletedBadge && <Chip size="small" label={deletedBadge} />}
      </Box>
      <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>
        {descriptions.length > 0 ? descriptions.join(', ') : t('workOrders.jobsTable.noDescription')}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
        <ScheduleIcon sx={{ fontSize: 18 }} />
        <Typography variant="body2">{formatScheduledRange(scheduledTime, durationMinutes, zone)}</Typography>
      </Box>

      <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={() => setMenuAnchor(null)}>
        <MenuItem
          disabled={editDisabled}
          onClick={() => {
            setMenuAnchor(null)
            onEdit()
          }}
        >
          {editLabel}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setMenuAnchor(null)
            onDelete()
          }}
          sx={{ color: 'error.main' }}
        >
          {deleteLabel}
        </MenuItem>
      </Menu>
    </Box>
  )
}
