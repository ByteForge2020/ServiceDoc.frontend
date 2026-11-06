import { useMemo, useState } from 'react'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import CloseIcon from '@mui/icons-material/Close'
import { DateTime } from 'luxon'
import { useTranslation } from 'react-i18next'
import { useShopTimeZone } from '../../../app/shop/useShopTimeZone'
import { useAppointmentQuery } from '../../appointments/queries'
import { JobDescriptionsField, type JobDescriptionDraft } from '../../jobs/components/JobDescriptionsField'
import { SlotScheduleFields } from '../../jobs/components/SlotScheduleFields'
import type { AppointmentSlotDescription, AppointmentSlotDescriptionPayload } from '../types'
import { AppointmentPicker, type AppointmentRef } from './AppointmentPicker'

export interface AppointmentSlotFormValues {
  appointmentId: string
  scheduledTime: string
  scheduledDurationMinutes: number
  descriptions: AppointmentSlotDescriptionPayload[]
}

interface AppointmentSlotFormModalProps {
  open: boolean
  title: string
  initialAppointment: AppointmentRef | null
  /** The appointment can't be changed (it is shown as fixed text). */
  lockAppointment?: boolean
  initialDateIso: string
  initialMinutes: number
  initialDurationMinutes: number
  initialDescriptions: AppointmentSlotDescription[]
  isSaving: boolean
  onClose: () => void
  onSave: (values: AppointmentSlotFormValues) => void
}

/**
 * The form for booking an employee's or a service bay's time for an appointment, shared by the four add / edit modals.
 * It mirrors the work order form; what can be picked as a description are the appointment's reasons.
 */
export function AppointmentSlotFormModal({
  open,
  title,
  initialAppointment,
  lockAppointment = false,
  initialDateIso,
  initialMinutes,
  initialDurationMinutes,
  initialDescriptions,
  isSaving,
  onClose,
  onSave,
}: AppointmentSlotFormModalProps) {
  const { t } = useTranslation()
  const zone = useShopTimeZone()

  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentRef | null>(initialAppointment)
  const [startDate, setStartDate] = useState<DateTime>(DateTime.fromISO(initialDateIso, { zone }))
  const [startMinutes, setStartMinutes] = useState<number>(initialMinutes)
  const [durationMinutes, setDurationMinutes] = useState<number>(initialDurationMinutes)
  // The draft's `estimateItemId` carries the reason's catalog id here: the field only needs an opaque id to tell the
  // picked options apart, and it is sent to the server as `estimateMasterListId`.
  const [descriptions, setDescriptions] = useState<JobDescriptionDraft[]>(() =>
    initialDescriptions.map((description) => ({
      key: description.id,
      id: description.id,
      estimateItemId: description.estimateMasterListId,
      name: description.name,
    })),
  )

  const { data: appointment } = useAppointmentQuery(selectedAppointment?.id)

  const reasonOptions = useMemo(
    () => (appointment?.reasons ?? []).map((reason) => ({ id: reason.id, name: reason.name })),
    [appointment],
  )

  // An empty list of descriptions is valid.
  const canSave = !!selectedAppointment && startDate.isValid && durationMinutes > 0

  // Reasons belong to one appointment, so they are dropped when the appointment changes; custom descriptions stay.
  function dropReasonDescriptions() {
    setDescriptions((current) => current.filter((description) => description.estimateItemId === null))
  }

  function handleSelectAppointment(newAppointment: AppointmentRef) {
    setSelectedAppointment({ id: newAppointment.id, number: newAppointment.number })
    dropReasonDescriptions()
  }

  function handleChangeAppointment() {
    setSelectedAppointment(null)
    dropReasonDescriptions()
  }

  function handleSave() {
    if (!canSave || !selectedAppointment) {
      return
    }

    const scheduledTime = startDate
      .set({ hour: Math.floor(startMinutes / 60), minute: startMinutes % 60, second: 0, millisecond: 0 })
      .toUTC()
      .toISO()!

    onSave({
      appointmentId: selectedAppointment.id,
      scheduledTime,
      scheduledDurationMinutes: durationMinutes,
      descriptions: descriptions.map(({ id, estimateItemId, name }) => ({
        id,
        estimateMasterListId: estimateItemId,
        name,
      })),
    })
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { borderRadius: '12px' } } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {title}
        <IconButton onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>
          <AppointmentPicker
            selectedAppointment={selectedAppointment}
            locked={lockAppointment}
            onSelect={handleSelectAppointment}
            onChangeAppointment={handleChangeAppointment}
          />

          <SlotScheduleFields
            startDate={startDate}
            startMinutes={startMinutes}
            durationMinutes={durationMinutes}
            onStartDateChange={setStartDate}
            onStartMinutesChange={setStartMinutes}
            onDurationMinutesChange={setDurationMinutes}
          />

          <JobDescriptionsField
            services={reasonOptions}
            descriptions={descriptions}
            onChange={setDescriptions}
            disabled={!selectedAppointment}
            placeholder={
              selectedAppointment
                ? t('appointmentSlots.form.addDescriptionPlaceholder')
                : t('appointmentSlots.form.selectAppointmentFirst')
            }
            noServicesText={t('appointmentSlots.form.noReasonsLeft')}
          />

          <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end', pt: 1 }}>
            <Button variant="text" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button variant="contained" onClick={handleSave} disabled={!canSave} loading={isSaving}>
              {t('jobs.addJobModal.save')}
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  )
}
