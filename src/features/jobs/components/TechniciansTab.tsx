import { useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import { useTranslation } from 'react-i18next'
import { extractErrorMessage } from '../../../api/errorMessage'
import { useConfirm } from '../../../app/confirm/useConfirm'
import { useToasters } from '../../../app/toasters/useToasters'
import { EditAppointmentJobModal } from '../../appointmentSlots/components/EditAppointmentJobModal'
import {
  useAppointmentJobsQuery,
  useDeleteAppointmentJobMutation,
  useRescheduleAppointmentJobMutation,
} from '../../appointmentSlots/queries'
import { appointmentJobToCalendarEntry, type AppointmentJob } from '../../appointmentSlots/types'
import { useTeamMembersQuery } from '../../settings/teamMembers/queries'
import { useDeleteJobMutation, useJobsQuery, useRescheduleJobMutation } from '../queries'
import { useCalendarPreferencesStore } from '../calendarPreferencesStore'
import { appointmentParent, orderParent } from '../slotParent'
import { technicianDisplayName } from '../technicianUtils'
import { useCalendarRange } from '../useCalendarRange'
import { useFocusedEntryCheck } from '../useFocusedEntryCheck'
import {
  FREE_MODE,
  jobToCalendarEntry,
  type CalendarEntry,
  type CalendarTabProps,
  type Job,
} from '../types'
import { AddJobModal } from './AddJobModal'
import { EditJobModal } from './EditJobModal'
import { ResourceCalendar } from './ResourceCalendar'
import type { CalendarAddAction } from './ResourceGrid'
import { ResourceFilter } from './ResourceFilter'
import { ResourceWeekGrid } from './ResourceWeekGrid'

interface AddJobRequest {
  /** Null when the click wasn't on a technician's row (the week view): it is chosen in the form. */
  technicianId: string | null
  dateIso: string
  minutes: number
}

/** The technicians calendar: one row per technician; work orders' jobs and appointments' jobs as entries. */
export function TechniciansTab({
  selectedDate,
  view = 'day',
  onShiftDate,
  mode = FREE_MODE,
  maxHeight,
  onCreated,
  onUpdated,
  onDeleted,
  onFocusMissing,
}: CalendarTabProps) {
  const { t } = useTranslation()
  const toasters = useToasters()
  const confirm = useConfirm()
  const [addJobRequest, setAddJobRequest] = useState<AddJobRequest | null>(null)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [editingAppointmentJob, setEditingAppointmentJob] = useState<AppointmentJob | null>(null)
  // The week view shows every technician together unless some are picked; the pick is remembered.
  const storedFilterIds = useCalendarPreferencesStore((state) => state.technicianFilterIds)
  const setFilterIds = useCalendarPreferencesStore((state) => state.setTechnicianFilterIds)
  const deleteJobMutation = useDeleteJobMutation()
  const rescheduleJobMutation = useRescheduleJobMutation()
  const deleteAppointmentJobMutation = useDeleteAppointmentJobMutation()
  const rescheduleAppointmentJobMutation = useRescheduleAppointmentJobMutation()

  const { weekStart, from, to } = useCalendarRange(selectedDate, view)

  const { data: technicians, isPending: isTechniciansPending } = useTeamMembersQuery()
  const { data: jobs, isPending: isJobsPending, isPlaceholderData: isJobsPlaceholder } = useJobsQuery(from, to)
  const {
    data: appointmentJobs,
    isPending: isAppointmentJobsPending,
    isPlaceholderData: isAppointmentJobsPlaceholder,
  } = useAppointmentJobsQuery(from, to)

  const rows = useMemo(
    () => (technicians ?? []).map((member) => ({ id: member.id, name: technicianDisplayName(member) })),
    [technicians],
  )
  const entries = useMemo(
    () => [...(jobs ?? []).map(jobToCalendarEntry), ...(appointmentJobs ?? []).map(appointmentJobToCalendarEntry)],
    [jobs, appointmentJobs],
  )
  // A remembered technician may be gone since: only those still on the team count, so the week can't end up empty.
  const filterIds = useMemo(
    () => storedFilterIds.filter((id) => rows.some((row) => row.id === id)),
    [storedFilterIds, rows],
  )
  const visibleEntries = useMemo(
    () => (filterIds.length === 0 ? entries : entries.filter((entry) => filterIds.includes(entry.rowId))),
    [entries, filterIds],
  )

  const isPending = isTechniciansPending || isJobsPending || isAppointmentJobsPending

  useFocusedEntryCheck(
    mode,
    !isPending && !isJobsPlaceholder && !isAppointmentJobsPlaceholder,
    entries,
    rows,
    onFocusMissing,
  )

  // One way to add: a click on an empty place opens the form, where a work order or an appointment is picked
  // (or it is already known, when the calendar was opened from one).
  const addActions = useMemo<CalendarAddAction[]>(
    () => [
      {
        key: 'add',
        label: t('jobs.addJobPopup.addJob'),
        onSelect: ({ rowId, minutes, dateIso }) =>
          setAddJobRequest({ technicianId: rowId, dateIso: dateIso ?? selectedDate, minutes }),
      },
    ],
    [selectedDate, t],
  )

  const lockedParent =
    mode.kind === 'addToOrder'
      ? orderParent(mode.order)
      : mode.kind === 'addToAppointment'
        ? appointmentParent(mode.appointment)
        : undefined

  async function handleDelete(entry: CalendarEntry) {
    const isAppointment = entry.kind === 'appointment'

    const confirmed = await confirm({
      message: isAppointment
        ? t('appointmentSlots.jobs.deleteConfirmMessage', { number: entry.parentNumber })
        : t('jobs.jobCard.deleteConfirmMessage', { orderNumber: entry.parentNumber }),
      confirmLabel: t('jobs.jobCard.deleteJob'),
      destructive: true,
    })

    if (!confirmed) {
      return
    }

    const mutation = isAppointment ? deleteAppointmentJobMutation : deleteJobMutation

    mutation.mutate(entry.id, {
      onSuccess: () => {
        toasters.success(t('jobs.jobCard.deleteSuccess'))
        onDeleted?.()
      },
      onError: (error) => {
        toasters.error(extractErrorMessage(error, t('jobs.jobCard.deleteError')))
      },
    })
  }

  function handleMove({ entry, rowId, rowName, scheduledTime }: {
    entry: CalendarEntry
    rowId: string
    rowName: string
    scheduledTime: string
  }) {
    const mutation = entry.kind === 'appointment' ? rescheduleAppointmentJobMutation : rescheduleJobMutation

    mutation.mutate(
      { id: entry.id, assignedUserId: rowId, assignedUserName: rowName, scheduledTime },
      {
        onSuccess: () => {
          toasters.success(t('jobs.dragDrop.rescheduleSuccess'))
        },
        onError: (error) => {
          toasters.error(extractErrorMessage(error, t('jobs.dragDrop.rescheduleError')))
        },
      },
    )
  }

  function handleEdit(entry: CalendarEntry) {
    if (entry.kind === 'appointment') {
      setEditingAppointmentJob(appointmentJobs?.find((job) => job.id === entry.id) ?? null)
    } else {
      setEditingJob(jobs?.find((job) => job.id === entry.id) ?? null)
    }
  }

  if (isPending) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  const entryLabels = {
    menuAria: t('jobs.jobCard.menuAria'),
    edit: t('jobs.jobCard.editJob'),
    delete: t('jobs.jobCard.deleteJob'),
  }

  return (
    <>
      {view === 'week' ? (
        <Stack spacing={2}>
          <ResourceFilter
            placeholder={t('jobs.filter.technicians')}
            options={rows}
            selectedIds={filterIds}
            onChange={setFilterIds}
          />
          <ResourceWeekGrid
            weekStart={weekStart}
            resourceKind="technician"
            allEntries={entries}
            entries={visibleEntries}
            defaultRowId={filterIds.length === 1 ? filterIds[0] : null}
            maxHeight={maxHeight}
            addActions={addActions}
            entryLabels={entryLabels}
            onShiftWeek={onShiftDate}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onMove={handleMove}
          />
        </Stack>
      ) : (
        <ResourceCalendar
          rows={rows}
          entries={entries}
          selectedDate={selectedDate}
          onShiftDate={onShiftDate}
          mode={mode}
          maxHeight={maxHeight}
          emptyRowsText={t('jobs.noTechnicians')}
          addActions={addActions}
          entryLabels={entryLabels}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onMove={handleMove}
        />
      )}

      {addJobRequest && (
        <AddJobModal
          open
          technicianId={addJobRequest.technicianId}
          dateIso={addJobRequest.dateIso}
          minutes={addJobRequest.minutes}
          lockedParent={lockedParent}
          onCreated={onCreated}
          onClose={() => setAddJobRequest(null)}
        />
      )}

      {editingJob && (
        <EditJobModal open job={editingJob} onUpdated={onUpdated} onClose={() => setEditingJob(null)} />
      )}

      {editingAppointmentJob && (
        <EditAppointmentJobModal
          open
          job={editingAppointmentJob}
          onUpdated={onUpdated}
          onClose={() => setEditingAppointmentJob(null)}
        />
      )}
    </>
  )
}
