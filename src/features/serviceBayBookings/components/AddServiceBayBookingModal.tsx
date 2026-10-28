import { useTranslation } from 'react-i18next'
import { useToasters } from '../../../app/toasters/useToasters'
import { JobFormModal, type JobFormValues } from '../../jobs/components/JobFormModal'
import type { WorkOrderSummary } from '../../workOrders/types'
import { bookingErrorMessage } from '../bookingErrorMessage'
import { useCreateServiceBayBookingMutation } from '../queries'

interface AddServiceBayBookingModalProps {
  open: boolean
  serviceBayId: string
  serviceBayName: string
  dateIso: string
  minutes: number
  /** The order the booking is for, when it is already known: shown as fixed text instead of an order picker. */
  lockedOrder?: WorkOrderSummary
  onCreated?: () => void
  onClose: () => void
}

export function AddServiceBayBookingModal({
  open,
  serviceBayId,
  serviceBayName,
  dateIso,
  minutes,
  lockedOrder,
  onCreated,
  onClose,
}: AddServiceBayBookingModalProps) {
  const { t } = useTranslation()
  const toasters = useToasters()
  const createMutation = useCreateServiceBayBookingMutation()

  function handleSave(values: JobFormValues) {
    createMutation.mutate(
      { ...values, serviceBayId },
      {
        onSuccess: () => {
          toasters.success(t('serviceBayBookings.addModal.createSuccess'))
          onClose()
          onCreated?.()
        },
        onError: (error) => {
          toasters.error(bookingErrorMessage(error, t('serviceBayBookings.addModal.createError')))
        },
      },
    )
  }

  return (
    <JobFormModal
      open={open}
      title={t('serviceBayBookings.addModal.title', { serviceBay: serviceBayName })}
      initialOrder={lockedOrder ?? null}
      lockOrder={lockedOrder !== undefined}
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
