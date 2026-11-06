import { DateTime } from 'luxon'
import { useTranslation } from 'react-i18next'
import { extractErrorMessage } from '../../../api/errorMessage'
import { useShopTimeZone } from '../../../app/shop/useShopTimeZone'
import { useToasters } from '../../../app/toasters/useToasters'
import { utcIsoToMinutesOfDay } from '../../../utils/timeGrid'
import { useUpdateAppointmentJobMutation } from '../queries'
import type { AppointmentJob } from '../types'
import { AppointmentSlotFormModal, type AppointmentSlotFormValues } from './AppointmentSlotFormModal'

interface EditAppointmentJobModalProps {
  open: boolean
  job: AppointmentJob
  onUpdated?: () => void
  onClose: () => void
}

export function EditAppointmentJobModal({ open, job, onUpdated, onClose }: EditAppointmentJobModalProps) {
  const { t } = useTranslation()
  const toasters = useToasters()
  const zone = useShopTimeZone()
  const updateMutation = useUpdateAppointmentJobMutation(job.id)

  function handleSave(values: AppointmentSlotFormValues) {
    updateMutation.mutate(values, {
      onSuccess: () => {
        toasters.success(t('appointmentSlots.jobs.updateSuccess'))
        onClose()
        onUpdated?.()
      },
      onError: (error) => {
        toasters.error(extractErrorMessage(error, t('appointmentSlots.jobs.updateError')))
      },
    })
  }

  return (
    <AppointmentSlotFormModal
      open={open}
      title={t('appointmentSlots.jobs.editTitle', { technician: job.assignedUserName })}
      initialAppointment={{ id: job.appointmentId, number: job.appointmentNumber }}
      initialDateIso={DateTime.fromISO(job.scheduledTime, { zone: 'utc' }).setZone(zone).toISODate()!}
      initialMinutes={utcIsoToMinutesOfDay(job.scheduledTime, zone)}
      initialDurationMinutes={job.scheduledDurationMinutes}
      initialDescriptions={job.descriptions}
      isSaving={updateMutation.isPending}
      onClose={onClose}
      onSave={handleSave}
    />
  )
}
