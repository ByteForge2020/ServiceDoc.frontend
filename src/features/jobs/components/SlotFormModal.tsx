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
import { FormSelect } from '../../../components/form/FormSelect'
import { useAppointmentQuery } from '../../appointments/queries'
import { useWorkOrderQuery } from '../../workOrders/queries'
import type { SlotParent } from '../slotParent'
import type { ResourceField } from '../useResourceField'
import { JobDescriptionsField, type JobDescriptionDraft } from './JobDescriptionsField'
import { ParentPicker } from './ParentPicker'
import { SlotScheduleFields } from './SlotScheduleFields'

/** A description as the form hands it over: `sourceId` is the order's service or the appointment's reason it was picked from. */
export interface SlotFormDescription {
  id: string | null
  sourceId: string | null
  name: string
}

export interface SlotFormValues {
  /** The work order or the appointment the time is booked for: its kind decides what is created. */
  parent: SlotParent
  /** The employee (jobs) or the service bay (bookings) the time is booked for. */
  resourceId: string
  scheduledTime: string
  scheduledDurationMinutes: number
  descriptions: SlotFormDescription[]
}

interface SlotFormModalProps {
  open: boolean
  title: string
  /** The work order or appointment known in advance (e.g. the calendar was opened from it). */
  initialParent: SlotParent | null
  /** The parent can't be changed (it is shown as fixed text). */
  lockParent?: boolean
  /** What the time is booked for (an employee, or a service bay) and the choices; it is picked in the form. */
  resource: ResourceField
  /** Preselected, e.g. the row that was clicked; null leaves the choice to the user. */
  initialResourceId: string | null
  initialDateIso: string
  initialMinutes: number
  initialDurationMinutes: number
  isSaving: boolean
  onClose: () => void
  onSave: (values: SlotFormValues) => void
}

/**
 * The form for booking an employee's or a service bay's time, for a work order or for an appointment: one form for
 * both, the picked parent decides which is created. What can be picked as a description follows the parent: the
 * order's services, or the appointment's reasons.
 */
export function SlotFormModal({
  open,
  title,
  initialParent,
  lockParent = false,
  resource,
  initialResourceId,
  initialDateIso,
  initialMinutes,
  initialDurationMinutes,
  isSaving,
  onClose,
  onSave,
}: SlotFormModalProps) {
  const { t } = useTranslation()
  const zone = useShopTimeZone()

  const [parent, setParent] = useState<SlotParent | null>(initialParent)
  const [resourceId, setResourceId] = useState<string>(initialResourceId ?? '')
  const [startDate, setStartDate] = useState<DateTime>(DateTime.fromISO(initialDateIso, { zone }))
  const [startMinutes, setStartMinutes] = useState<number>(initialMinutes)
  const [durationMinutes, setDurationMinutes] = useState<number>(initialDurationMinutes)
  // The draft's `estimateItemId` carries the id of what the description was picked from (the order's service, or the
  // appointment's reason): the field only needs an opaque id to tell the picked options apart.
  const [descriptions, setDescriptions] = useState<JobDescriptionDraft[]>([])

  const { data: order } = useWorkOrderQuery(parent?.kind === 'order' ? parent.id : undefined)
  const { data: appointment } = useAppointmentQuery(parent?.kind === 'appointment' ? parent.id : undefined)

  const sourceOptions = useMemo(
    () =>
      parent?.kind === 'appointment'
        ? (appointment?.reasons ?? []).map((reason) => ({ id: reason.id, name: reason.name }))
        : (order?.estimateItems ?? []).map((item) => ({ id: item.id, name: item.name })),
    [parent?.kind, order, appointment],
  )

  // An empty list of descriptions is valid.
  const canSave = !!parent && resourceId !== '' && startDate.isValid && durationMinutes > 0

  // Services and reasons belong to one parent, so they are dropped when it changes; custom descriptions stay.
  function dropPickedDescriptions() {
    setDescriptions((current) => current.filter((description) => description.estimateItemId === null))
  }

  function handleSelectParent(newParent: SlotParent) {
    setParent(newParent)
    dropPickedDescriptions()
  }

  function handleChangeParent() {
    setParent(null)
    dropPickedDescriptions()
  }

  function handleSave() {
    if (!canSave || !parent) {
      return
    }

    const scheduledTime = startDate
      .set({ hour: Math.floor(startMinutes / 60), minute: startMinutes % 60, second: 0, millisecond: 0 })
      .toUTC()
      .toISO()!

    onSave({
      parent,
      resourceId,
      scheduledTime,
      scheduledDurationMinutes: durationMinutes,
      descriptions: descriptions.map(({ id, estimateItemId, name }) => ({ id, sourceId: estimateItemId, name })),
    })
  }

  const descriptionPlaceholder = !parent
    ? t('slotForm.selectParentFirst')
    : parent.kind === 'appointment'
      ? t('appointmentSlots.form.addDescriptionPlaceholder')
      : t('jobs.addJobModal.addDescriptionPlaceholder')

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
          <ParentPicker
            selectedParent={parent}
            locked={lockParent}
            onSelect={handleSelectParent}
            onChange={handleChangeParent}
          />

          <FormSelect
            label={resource.label}
            placeholder={resource.placeholder}
            // The options may still be loading; the chosen id is kept meanwhile.
            value={resource.options.some((option) => option.value === resourceId) ? resourceId : ''}
            onChange={setResourceId}
            options={resource.options}
            required
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
            services={sourceOptions}
            descriptions={descriptions}
            onChange={setDescriptions}
            disabled={!parent}
            placeholder={descriptionPlaceholder}
            noServicesText={parent?.kind === 'appointment' ? t('appointmentSlots.form.noReasonsLeft') : undefined}
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
