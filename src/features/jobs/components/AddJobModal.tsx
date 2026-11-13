import { useTranslation } from 'react-i18next'
import { extractErrorMessage } from '../../../api/errorMessage'
import { useToasters } from '../../../app/toasters/useToasters'
import { useCreateAppointmentJobMutation } from '../../appointmentSlots/queries'
import { useCreateJobMutation } from '../queries'
import type { SlotParent } from '../slotParent'
import { useTechnicianField } from '../useResourceField'
import { SlotFormModal, type SlotFormValues } from './SlotFormModal'

interface AddJobModalProps {
  open: boolean
  /** The employee preselected (the row that was clicked); null leaves the choice to the user. */
  technicianId: string | null
  dateIso: string
  minutes: number
  /** The work order or appointment the job is for, when it is already known: shown as fixed text instead of a picker. */
  lockedParent?: SlotParent
  onCreated?: () => void
  onClose: () => void
}

/** Adds an employee's time for a work order or for an appointment, whichever is picked in the form. */
export function AddJobModal({ open, technicianId, dateIso, minutes, lockedParent, onCreated, onClose }: AddJobModalProps) {
  const { t } = useTranslation()
  const toasters = useToasters()
  const createJobMutation = useCreateJobMutation()
  const createAppointmentJobMutation = useCreateAppointmentJobMutation()
  const technicianField = useTechnicianField()

  function handleSave({ parent, resourceId, scheduledTime, scheduledDurationMinutes, descriptions }: SlotFormValues) {
    const isOrder = parent.kind === 'order'
    const callbacks = {
      onSuccess: () => {
        toasters.success(t(isOrder ? 'jobs.addJobModal.createSuccess' : 'appointmentSlots.jobs.createSuccess'))
        onClose()
        onCreated?.()
      },
      onError: (error: unknown) => {
        toasters.error(
          extractErrorMessage(error, t(isOrder ? 'jobs.addJobModal.createError' : 'appointmentSlots.jobs.createError')),
        )
      },
    }

    if (isOrder) {
      createJobMutation.mutate(
        {
          orderId: parent.id,
          assignedUserId: resourceId,
          scheduledTime,
          scheduledDurationMinutes,
          descriptions: descriptions.map(({ id, sourceId, name }) => ({ id, estimateItemId: sourceId, name })),
        },
        callbacks,
      )
    } else {
      createAppointmentJobMutation.mutate(
        {
          appointmentId: parent.id,
          assignedUserId: resourceId,
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
      title={t('slotForm.addJobTitle')}
      initialParent={lockedParent ?? null}
      lockParent={lockedParent !== undefined}
      resource={technicianField}
      initialResourceId={technicianId}
      initialDateIso={dateIso}
      initialMinutes={minutes}
      initialDurationMinutes={30}
      isSaving={createJobMutation.isPending || createAppointmentJobMutation.isPending}
      onClose={onClose}
      onSave={handleSave}
    />
  )
}
