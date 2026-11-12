import { useTranslation } from 'react-i18next'
import { extractErrorMessage } from '../../../api/errorMessage'
import { useToasters } from '../../../app/toasters/useToasters'
import type { WorkOrderSummary } from '../../workOrders/types'
import { useCreateJobMutation } from '../queries'
import { useTechnicianField } from '../useResourceField'
import { JobFormModal, type JobFormValues } from './JobFormModal'

interface AddJobModalProps {
  open: boolean
  /** The employee preselected (the row that was clicked); null leaves the choice to the user. */
  technicianId: string | null
  dateIso: string
  minutes: number
  /** The order the job is for, when it is already known: shown as fixed text instead of an order picker. */
  lockedOrder?: WorkOrderSummary
  onCreated?: () => void
  onClose: () => void
}

export function AddJobModal({
  open,
  technicianId,
  dateIso,
  minutes,
  lockedOrder,
  onCreated,
  onClose,
}: AddJobModalProps) {
  const { t } = useTranslation()
  const toasters = useToasters()
  const createJobMutation = useCreateJobMutation()
  const technicianField = useTechnicianField()

  function handleSave({ resourceId, ...values }: JobFormValues) {
    createJobMutation.mutate(
      { ...values, assignedUserId: resourceId },
      {
        onSuccess: () => {
          toasters.success(t('jobs.addJobModal.createSuccess'))
          onClose()
          onCreated?.()
        },
        onError: (error) => {
          toasters.error(extractErrorMessage(error, t('jobs.addJobModal.createError')))
        },
      },
    )
  }

  return (
    <JobFormModal
      open={open}
      title={t('jobs.addJobModal.title')}
      initialOrder={lockedOrder ?? null}
      lockOrder={lockedOrder !== undefined}
      resource={technicianField}
      initialResourceId={technicianId}
      initialDateIso={dateIso}
      initialMinutes={minutes}
      initialDurationMinutes={30}
      initialDescriptions={[]}
      isSaving={createJobMutation.isPending}
      onClose={onClose}
      onSave={handleSave}
    />
  )
}
