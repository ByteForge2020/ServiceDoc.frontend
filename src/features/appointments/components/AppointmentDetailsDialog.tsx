import CloseIcon from '@mui/icons-material/Close'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { AxiosError } from 'axios'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { extractErrorMessage } from '../../../api/errorMessage'
import { useShopTimeZone } from '../../../app/shop/useShopTimeZone'
import { useToasters } from '../../../app/toasters/useToasters'
import { formatScheduledRange } from '../../../utils/timeGrid'
import { APPOINTMENT_STATUS_COLOR, APPOINTMENT_STATUS_LABEL_KEY } from '../appointmentStatus'
import { useConvertAppointmentMutation } from '../queries'
import type { Appointment } from '../types'

interface AppointmentDetailsDialogProps {
  appointment: Appointment
  onClose: () => void
}

export function AppointmentDetailsDialog({ appointment, onClose }: AppointmentDetailsDialogProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const zone = useShopTimeZone()
  const toasters = useToasters()
  const convertMutation = useConvertAppointmentMutation()

  const isConverted = !!appointment.convertedWorkOrderId

  function handleConvert() {
    convertMutation.mutate(appointment.id, {
      onSuccess: (updated) => {
        toasters.success(t('appointmentsPage.details.convertSuccess'))
        onClose()
        if (updated.convertedWorkOrderId) {
          navigate(`/orders/${updated.convertedWorkOrderId}`)
        }
      },
      onError: (error) => {
        if (error instanceof AxiosError && error.response?.status === 409) {
          toasters.error(t('appointmentsPage.details.convertConflict'))
          return
        }
        toasters.error(extractErrorMessage(error, t('appointmentsPage.details.convertError')))
      },
    })
  }

  function handleViewOrder() {
    if (!appointment.convertedWorkOrderId) {
      return
    }
    onClose()
    navigate(`/orders/${appointment.convertedWorkOrderId}`)
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs" slotProps={{ paper: { sx: { borderRadius: '12px' } } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {t('appointmentsPage.details.title', { number: appointment.number })}
        <IconButton onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <Chip
              size="small"
              color={APPOINTMENT_STATUS_COLOR[appointment.status]}
              label={t(APPOINTMENT_STATUS_LABEL_KEY[appointment.status])}
            />
            {isConverted && (
              <Chip
                size="small"
                variant="outlined"
                label={t('appointmentsPage.details.convertedBadge', { number: appointment.convertedOrderNumber })}
              />
            )}
          </Stack>

          <DetailRow
            label={t('appointmentsPage.details.dateTime')}
            value={formatScheduledRange(appointment.scheduledTime, appointment.durationMinutes, zone)}
          />

          <DetailRow
            label={t('appointmentsPage.details.client')}
            value={appointment.customerName?.trim() || t('appointmentsPage.card.noCustomer')}
            secondary={appointment.customer?.phone ?? appointment.customer?.email ?? undefined}
          />

          <DetailRow
            label={t('appointmentsPage.details.vehicle')}
            value={appointment.vehicleDescription ?? t('appointmentsPage.details.noVehicle')}
            secondary={appointment.vehicle?.licensePlate ?? undefined}
          />

          <Stack spacing={0.5}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              {t('appointmentsPage.details.reason')}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
              {appointment.reasons.map((reason) => (
                <Chip key={reason.id} size="small" variant="outlined" label={reason.name} />
              ))}
            </Stack>
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button variant="text" onClick={onClose}>
          {t('common.close')}
        </Button>
        {isConverted ? (
          <Button variant="contained" onClick={handleViewOrder}>
            {t('appointmentsPage.details.viewOrder')}
          </Button>
        ) : (
          <Button variant="contained" onClick={handleConvert} loading={convertMutation.isPending}>
            {t('appointmentsPage.details.convertToOrder')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

function DetailRow({ label, value, secondary }: { label: string; value: string; secondary?: string }) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
        {label}
      </Typography>
      <Typography variant="body1">{value}</Typography>
      {secondary && (
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {secondary}
        </Typography>
      )}
    </Stack>
  )
}
