import { useTranslation } from 'react-i18next'
import { extractErrorMessage } from '../../../api/errorMessage'
import { useToasters } from '../../../app/toasters/useToasters'
import type { AppointmentSummary } from '../../appointments/types'
import { useCreateAppointmentJobMutation } from '../queries'
import { AppointmentSlotFormModal, type AppointmentSlotFormValues } from './AppointmentSlotFormModal'

interface AddAppointmentJobModalProps {
  open: boolean
  technicianId: string
  technicianName: string
  dateIso: string
  minutes: number
  /** The appointment the job is for, when it is already known: shown as fixed text instead of a picker. */
  lockedAppointment?: AppointmentSummary
  onCreated?: () => void
  onClose: () => void
}

export function AddAppointmentJobModal({
  open,
  technicianId,
  technicianName,
  dateIso,
  minutes,
  lockedAppointment,
  onCreated,
  onClose,
}: AddAppointmentJobModalProps) {
  const { t } = useTranslation()
  const toasters = useToasters()
  const createMutation = useCreateAppointmentJobMutation()

  function handleSave(values: AppointmentSlotFormValues) {
    createMutation.mutate(
      { ...values, assignedUserId: technicianId },
      {
        onSuccess: () => {
          toasters.success(t('appointmentSlots.jobs.createSuccess'))
          onClose()
          onCreated?.()
        },
        onError: (error) => {
          toasters.error(extractErrorMessage(error, t('appointmentSlots.jobs.createError')))
        },
      },
    )
  }

  return (
    <AppointmentSlotFormModal
      open={open}
      title={t('appointmentSlots.jobs.addTitle', { technician: technicianName })}
      initialAppointment={lockedAppointment ?? null}
      lockAppointment={lockedAppointment !== undefined}
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
