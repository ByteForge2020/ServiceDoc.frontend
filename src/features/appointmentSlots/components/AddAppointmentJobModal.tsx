import { useTranslation } from 'react-i18next'
import { extractErrorMessage } from '../../../api/errorMessage'
import { useToasters } from '../../../app/toasters/useToasters'
import type { AppointmentSummary } from '../../appointments/types'
import { useTechnicianField } from '../../jobs/useResourceField'
import { useCreateAppointmentJobMutation } from '../queries'
import { AppointmentSlotFormModal, type AppointmentSlotFormValues } from './AppointmentSlotFormModal'

interface AddAppointmentJobModalProps {
  open: boolean
  /** The employee preselected (the row that was clicked); null leaves the choice to the user. */
  technicianId: string | null
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
  dateIso,
  minutes,
  lockedAppointment,
  onCreated,
  onClose,
}: AddAppointmentJobModalProps) {
  const { t } = useTranslation()
  const toasters = useToasters()
  const createMutation = useCreateAppointmentJobMutation()
  const technicianField = useTechnicianField()

  function handleSave({ resourceId, ...values }: AppointmentSlotFormValues) {
    createMutation.mutate(
      { ...values, assignedUserId: resourceId },
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
      title={t('appointmentSlots.jobs.addTitle')}
      initialAppointment={lockedAppointment ?? null}
      lockAppointment={lockedAppointment !== undefined}
      resource={technicianField}
      initialResourceId={technicianId}
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
