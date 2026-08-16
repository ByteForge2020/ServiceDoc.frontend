import { DateTime } from 'luxon'
import { useTranslation } from 'react-i18next'
import { extractErrorMessage } from '../../../api/errorMessage'
import { useShopTimeZone } from '../../../app/shop/useShopTimeZone'
import { useToasters } from '../../../app/toasters/useToasters'
import { useUpdateJobMutation } from '../queries'
import { utcIsoToMinutesOfDay } from '../timeUtils'
import type { Job } from '../types'
import { JobFormModal, type JobFormValues } from './JobFormModal'

interface EditJobModalProps {
  open: boolean
  job: Job
  onClose: () => void
}

export function EditJobModal({ open, job, onClose }: EditJobModalProps) {
  const { t } = useTranslation()
  const toasters = useToasters()
  const zone = useShopTimeZone()
  const updateJobMutation = useUpdateJobMutation(job.id)

  function handleSave(values: JobFormValues) {
    updateJobMutation.mutate(values, {
      onSuccess: () => {
        toasters.success(t('jobs.editJobModal.updateSuccess'))
        onClose()
      },
      onError: (error) => {
        toasters.error(extractErrorMessage(error, t('jobs.editJobModal.updateError')))
      },
    })
  }

  return (
    <JobFormModal
      open={open}
      title={t('jobs.editJobModal.title', { technician: job.assignedUserName })}
      initialOrder={{ id: job.orderId, orderNumber: job.orderNumber }}
      initialDateIso={DateTime.fromISO(job.scheduledTime, { zone: 'utc' }).setZone(zone).toISODate()!}
      initialMinutes={utcIsoToMinutesOfDay(job.scheduledTime, zone)}
      initialDurationMinutes={job.scheduledDurationMinutes}
      initialEstimateItemId={job.estimateItemId}
      isSaving={updateJobMutation.isPending}
      onClose={onClose}
      onSave={handleSave}
    />
  )
}
