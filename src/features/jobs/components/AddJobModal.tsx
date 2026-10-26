import { useTranslation } from 'react-i18next'
import { extractErrorMessage } from '../../../api/errorMessage'
import { useToasters } from '../../../app/toasters/useToasters'
import type { WorkOrderSummary } from '../../workOrders/types'
import { useCreateJobMutation } from '../queries'
import { JobFormModal, type JobFormValues } from './JobFormModal'

interface AddJobModalProps {
  open: boolean
  technicianId: string
  technicianName: string
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
  technicianName,
  dateIso,
  minutes,
  lockedOrder,
  onCreated,
  onClose,
}: AddJobModalProps) {
  const { t } = useTranslation()
  const toasters = useToasters()
  const createJobMutation = useCreateJobMutation()

  function handleSave(values: JobFormValues) {
    createJobMutation.mutate(
      { ...values, assignedUserId: technicianId },
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
      title={t('jobs.addJobModal.title', { technician: technicianName })}
      initialOrder={lockedOrder ?? null}
      lockOrder={lockedOrder !== undefined}
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
