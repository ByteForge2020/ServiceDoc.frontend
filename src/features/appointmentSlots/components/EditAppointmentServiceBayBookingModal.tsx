import { DateTime } from 'luxon'
import { useTranslation } from 'react-i18next'
import { useShopTimeZone } from '../../../app/shop/useShopTimeZone'
import { useToasters } from '../../../app/toasters/useToasters'
import { utcIsoToMinutesOfDay } from '../../../utils/timeGrid'
import { bookingErrorMessage } from '../../serviceBayBookings/bookingErrorMessage'
import { useUpdateAppointmentServiceBayBookingMutation } from '../queries'
import type { AppointmentServiceBayBooking } from '../types'
import { AppointmentSlotFormModal, type AppointmentSlotFormValues } from './AppointmentSlotFormModal'

interface EditAppointmentServiceBayBookingModalProps {
  open: boolean
  booking: AppointmentServiceBayBooking
  onUpdated?: () => void
  onClose: () => void
}

export function EditAppointmentServiceBayBookingModal({
  open,
  booking,
  onUpdated,
  onClose,
}: EditAppointmentServiceBayBookingModalProps) {
  const { t } = useTranslation()
  const toasters = useToasters()
  const zone = useShopTimeZone()
  const updateMutation = useUpdateAppointmentServiceBayBookingMutation(booking.id)

  function handleSave(values: AppointmentSlotFormValues) {
    updateMutation.mutate(values, {
      onSuccess: () => {
        toasters.success(t('appointmentSlots.bookings.updateSuccess'))
        onClose()
        onUpdated?.()
      },
      onError: (error) => {
        toasters.error(bookingErrorMessage(error, t('appointmentSlots.bookings.updateError')))
      },
    })
  }

  return (
    <AppointmentSlotFormModal
      open={open}
      title={t('appointmentSlots.bookings.editTitle', { serviceBay: booking.serviceBayName })}
      initialAppointment={{ id: booking.appointmentId, number: booking.appointmentNumber }}
      initialDateIso={DateTime.fromISO(booking.scheduledTime, { zone: 'utc' }).setZone(zone).toISODate()!}
      initialMinutes={utcIsoToMinutesOfDay(booking.scheduledTime, zone)}
      initialDurationMinutes={booking.scheduledDurationMinutes}
      initialDescriptions={booking.descriptions}
      isSaving={updateMutation.isPending}
      onClose={onClose}
      onSave={handleSave}
    />
  )
}
