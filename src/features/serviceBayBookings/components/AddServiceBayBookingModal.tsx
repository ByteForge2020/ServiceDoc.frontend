import { useTranslation } from 'react-i18next'
import { useToasters } from '../../../app/toasters/useToasters'
import { SlotFormModal, type SlotFormValues } from '../../jobs/components/SlotFormModal'
import type { SlotParent } from '../../jobs/slotParent'
import { useServiceBayField } from '../../jobs/useResourceField'
import { useCreateAppointmentServiceBayBookingMutation } from '../../appointmentSlots/queries'
import { bookingErrorMessage } from '../bookingErrorMessage'
import { useCreateServiceBayBookingMutation } from '../queries'

interface AddServiceBayBookingModalProps {
  open: boolean
  /** The bay preselected (the row that was clicked); null leaves the choice to the user. */
  serviceBayId: string | null
  dateIso: string
  minutes: number
  /** The work order or appointment the booking is for, when it is already known: shown as fixed text instead of a picker. */
  lockedParent?: SlotParent
  onCreated?: () => void
  onClose: () => void
}

/** Books a service bay for a work order or for an appointment, whichever is picked in the form. */
export function AddServiceBayBookingModal({
  open,
  serviceBayId,
  dateIso,
  minutes,
  lockedParent,
  onCreated,
  onClose,
}: AddServiceBayBookingModalProps) {
  const { t } = useTranslation()
  const toasters = useToasters()
  const createMutation = useCreateServiceBayBookingMutation()
  const createAppointmentMutation = useCreateAppointmentServiceBayBookingMutation()
  const serviceBayField = useServiceBayField()

  function handleSave({ parent, resourceId, scheduledTime, scheduledDurationMinutes, descriptions }: SlotFormValues) {
    const isOrder = parent.kind === 'order'
    const callbacks = {
      onSuccess: () => {
        toasters.success(t(isOrder ? 'serviceBayBookings.addModal.createSuccess' : 'appointmentSlots.bookings.createSuccess'))
        onClose()
        onCreated?.()
      },
      onError: (error: unknown) => {
        toasters.error(
          bookingErrorMessage(
            error,
            t(isOrder ? 'serviceBayBookings.addModal.createError' : 'appointmentSlots.bookings.createError'),
          ),
        )
      },
    }

    if (isOrder) {
      createMutation.mutate(
        {
          orderId: parent.id,
          serviceBayId: resourceId,
          scheduledTime,
          scheduledDurationMinutes,
          descriptions: descriptions.map(({ id, sourceId, name }) => ({ id, estimateItemId: sourceId, name })),
        },
        callbacks,
      )
    } else {
      createAppointmentMutation.mutate(
        {
          appointmentId: parent.id,
          serviceBayId: resourceId,
          scheduledTime,
          scheduledDurationMinutes,
          descriptions: descriptions.map(({ id, sourceId, name }) => ({ id, estimateMasterListId: sourceId, name })),
        },
        callbacks,
      )
    }
  }

  return (
    <SlotFormModal
      open={open}
      title={t('slotForm.bookBayTitle')}
      initialParent={lockedParent ?? null}
      lockParent={lockedParent !== undefined}
      resource={serviceBayField}
      initialResourceId={serviceBayId}
      initialDateIso={dateIso}
      initialMinutes={minutes}
      initialDurationMinutes={30}
      isSaving={createMutation.isPending || createAppointmentMutation.isPending}
      onClose={onClose}
      onSave={handleSave}
    />
  )
}
