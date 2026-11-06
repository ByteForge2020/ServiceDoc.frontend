import { useTranslation } from 'react-i18next'
import { useToasters } from '../../../app/toasters/useToasters'
import type { AppointmentSummary } from '../../appointments/types'
import { bookingErrorMessage } from '../../serviceBayBookings/bookingErrorMessage'
import { useCreateAppointmentServiceBayBookingMutation } from '../queries'
import { AppointmentSlotFormModal, type AppointmentSlotFormValues } from './AppointmentSlotFormModal'

interface AddAppointmentServiceBayBookingModalProps {
  open: boolean
  serviceBayId: string
  serviceBayName: string
  dateIso: string
  minutes: number
  /** The appointment the booking is for, when it is already known: shown as fixed text instead of a picker. */
  lockedAppointment?: AppointmentSummary
  onCreated?: () => void
  onClose: () => void
}

export function AddAppointmentServiceBayBookingModal({
  open,
  serviceBayId,
  serviceBayName,
  dateIso,
  minutes,
  lockedAppointment,
  onCreated,
  onClose,
}: AddAppointmentServiceBayBookingModalProps) {
  const { t } = useTranslation()
  const toasters = useToasters()
  const createMutation = useCreateAppointmentServiceBayBookingMutation()

  function handleSave(values: AppointmentSlotFormValues) {
    createMutation.mutate(
      { ...values, serviceBayId },
      {
        onSuccess: () => {
          toasters.success(t('appointmentSlots.bookings.createSuccess'))
          onClose()
          onCreated?.()
        },
        onError: (error) => {
          toasters.error(bookingErrorMessage(error, t('appointmentSlots.bookings.createError')))
        },
      },
    )
  }

  return (
    <AppointmentSlotFormModal
      open={open}
      title={t('appointmentSlots.bookings.addTitle', { serviceBay: serviceBayName })}
      initialAppointment={lockedAppointment ?? null}
      lockAppointment={lockedAppointment !== undefined}
      initialDateIso={dateIso}
      initialMinutes={minutes}
      initialDurationMinutes={30}
      initialDescriptions={[]}
      isSaving={createMutation.isPending}
      onClose={onClose}
      onSave={handleSave}
    />
  )
}
