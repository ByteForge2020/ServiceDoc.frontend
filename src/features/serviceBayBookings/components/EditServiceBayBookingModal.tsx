import { DateTime } from 'luxon'
import { useTranslation } from 'react-i18next'
import { useShopTimeZone } from '../../../app/shop/useShopTimeZone'
import { useToasters } from '../../../app/toasters/useToasters'
import { JobFormModal, type JobFormValues } from '../../jobs/components/JobFormModal'
import { utcIsoToMinutesOfDay } from '../../../utils/timeGrid'
import { bookingErrorMessage } from '../bookingErrorMessage'
import { useUpdateServiceBayBookingMutation } from '../queries'
import type { ServiceBayBooking } from '../types'

interface EditServiceBayBookingModalProps {
  open: boolean
  booking: ServiceBayBooking
  onUpdated?: () => void
  onClose: () => void
}

export function EditServiceBayBookingModal({ open, booking, onUpdated, onClose }: EditServiceBayBookingModalProps) {
  const { t } = useTranslation()
  const toasters = useToasters()
  const zone = useShopTimeZone()
  const updateMutation = useUpdateServiceBayBookingMutation(booking.id)

  function handleSave(values: JobFormValues) {
    updateMutation.mutate(values, {
      onSuccess: () => {
        toasters.success(t('serviceBayBookings.editModal.updateSuccess'))
        onClose()
        onUpdated?.()
      },
      onError: (error) => {
        toasters.error(bookingErrorMessage(error, t('serviceBayBookings.editModal.updateError')))
      },
    })
  }

  return (
    <JobFormModal
      open={open}
      title={t('serviceBayBookings.editModal.title', { serviceBay: booking.serviceBayName })}
      initialOrder={{ id: booking.orderId, orderNumber: booking.orderNumber }}
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
