import { useTranslation } from 'react-i18next'
import { extractErrorMessage } from '../../../api/errorMessage'
import { useToasters } from '../../../app/toasters/useToasters'
import { useCreateJobMutation } from '../queries'
import { JobFormModal, type JobFormValues } from './JobFormModal'

interface AddJobModalProps {
  open: boolean
  technicianId: string
  technicianName: string
  dateIso: string
  minutes: number
  onClose: () => void
}

export function AddJobModal({ open, technicianId, technicianName, dateIso, minutes, onClose }: AddJobModalProps) {
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
      initialOrder={null}
      initialDateIso={dateIso}
      initialMinutes={minutes}
      initialDurationMinutes={30}
      initialEstimateItemId={null}
      isSaving={createJobMutation.isPending}
      onClose={onClose}
      onSave={handleSave}
    />
  )
}
