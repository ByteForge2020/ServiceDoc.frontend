import { useTranslation } from 'react-i18next'
import { useToasters } from '../../../app/toasters/useToasters'
import { JobFormModal, type JobFormValues } from '../../jobs/components/JobFormModal'
import { useServiceBayField } from '../../jobs/useResourceField'
import type { WorkOrderSummary } from '../../workOrders/types'
import { bookingErrorMessage } from '../bookingErrorMessage'
import { useCreateServiceBayBookingMutation } from '../queries'

interface AddServiceBayBookingModalProps {
  open: boolean
  /** The bay preselected (the row that was clicked); null leaves the choice to the user. */
  serviceBayId: string | null
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
  dateIso,
  minutes,
  lockedOrder,
  onCreated,
  onClose,
}: AddServiceBayBookingModalProps) {
  const { t } = useTranslation()
  const toasters = useToasters()
  const createMutation = useCreateServiceBayBookingMutation()
  const serviceBayField = useServiceBayField()

  function handleSave({ resourceId, ...values }: JobFormValues) {
    createMutation.mutate(
      { ...values, serviceBayId: resourceId },
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
      title={t('serviceBayBookings.addModal.title')}
      initialOrder={lockedOrder ?? null}
      lockOrder={lockedOrder !== undefined}
      resource={serviceBayField}
      initialResourceId={serviceBayId}
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
