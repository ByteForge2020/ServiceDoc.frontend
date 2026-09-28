import { useMemo, useState } from 'react'
import AddIcon from '@mui/icons-material/Add'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { DateTime } from 'luxon'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { extractErrorMessage } from '../../api/errorMessage'
import { useConfirm } from '../../app/confirm/useConfirm'
import { useShopTimeZone } from '../../app/shop/useShopTimeZone'
import { useToasters } from '../../app/toasters/useToasters'
import { localDateAndMinutesToUtcIso } from '../../utils/timeGrid'
import { useAppointmentSettingsQuery } from '../settings/appointments/queries'
import { AppointmentDetailsDialog } from './components/AppointmentDetailsDialog'
import { AppointmentsWeekGrid } from './components/AppointmentsWeekGrid'
import { useAppointmentsQuery, useDeleteAppointmentMutation } from './queries'
import type { Appointment } from './types'
import { formatWeekRangeLabel, mondayOfWeek } from './weekUtils'

export function AppointmentsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const zone = useShopTimeZone()
  const toasters = useToasters()
  const confirm = useConfirm()
  const deleteMutation = useDeleteAppointmentMutation()

  const [weekStart, setWeekStart] = useState(() => mondayOfWeek(DateTime.local()).toISODate()!)
  const [detailsAppointment, setDetailsAppointment] = useState<Appointment | null>(null)

  const { from, to } = useMemo(
    () => ({
      from: localDateAndMinutesToUtcIso(weekStart, 0, zone),
      to: localDateAndMinutesToUtcIso(weekStart, 7 * 24 * 60, zone),
    }),
    [weekStart, zone],
  )

  const { data: settings, isPending: isSettingsPending } = useAppointmentSettingsQuery()
  const { data: appointments, isPending: isAppointmentsPending } = useAppointmentsQuery(from, to)

  function handlePrevWeek() {
    setWeekStart(DateTime.fromISO(weekStart).minus({ weeks: 1 }).toISODate()!)
  }

  function handleNextWeek() {
    setWeekStart(DateTime.fromISO(weekStart).plus({ weeks: 1 }).toISODate()!)
  }

  function handleToday() {
    setWeekStart(mondayOfWeek(DateTime.local()).toISODate()!)
  }

  function handleScheduleSlot(dateIso: string, minutes: number) {
    navigate('/appointments/new', { state: { dateIso, minutes } })
  }

  function handleEditAppointment(appointment: Appointment) {
    navigate(`/appointments/${appointment.id}`)
  }

  async function handleDeleteAppointment(appointment: Appointment) {
    const confirmed = await confirm({
      message: t('appointmentsPage.card.deleteConfirmMessage', { number: appointment.number }),
      confirmLabel: t('appointmentsPage.card.deleteAppointment'),
      destructive: true,
    })

    if (!confirmed) {
      return
    }

    deleteMutation.mutate(appointment.id, {
      onSuccess: () => {
        toasters.success(t('appointmentsPage.card.deleteSuccess'))
      },
      onError: (error) => {
        toasters.error(extractErrorMessage(error, t('appointmentsPage.card.deleteError')))
      },
    })
  }

  const isLoading = isSettingsPending || isAppointmentsPending || !settings

  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h2" component="h1">
          {t('appointmentsPage.title')}
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/appointments/new')}>
          {t('appointmentsPage.newAppointment')}
        </Button>
      </Stack>

      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <IconButton onClick={handlePrevWeek} aria-label={t('appointmentsPage.prevWeekAria')}>
          <ChevronLeftIcon />
        </IconButton>
        <IconButton onClick={handleNextWeek} aria-label={t('appointmentsPage.nextWeekAria')}>
          <ChevronRightIcon />
        </IconButton>
        <Button variant="outlined" onClick={handleToday}>
          {t('appointmentsPage.today')}
        </Button>
        <Typography variant="h5" component="span">
          {formatWeekRangeLabel(weekStart)}
        </Typography>
      </Stack>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <AppointmentsWeekGrid
          weekStart={weekStart}
          settings={settings}
          appointments={appointments ?? []}
          onScheduleSlot={handleScheduleSlot}
          onOpenDetails={setDetailsAppointment}
          onEditAppointment={handleEditAppointment}
          onDeleteAppointment={handleDeleteAppointment}
        />
      )}

      {detailsAppointment && (
        <AppointmentDetailsDialog appointment={detailsAppointment} onClose={() => setDetailsAppointment(null)} />
      )}
    </Stack>
  )
}
