import { useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import { useTranslation } from 'react-i18next'
import { extractErrorMessage } from '../../../api/errorMessage'
import { useConfirm } from '../../../app/confirm/useConfirm'
import { useToasters } from '../../../app/toasters/useToasters'
import { AddAppointmentJobModal } from '../../appointmentSlots/components/AddAppointmentJobModal'
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
import { technicianDisplayName } from '../technicianUtils'
import { useCalendarRange } from '../useCalendarRange'
import { useFocusedEntryCheck } from '../useFocusedEntryCheck'
import {
  FREE_MODE,
  jobToCalendarEntry,
  type CalendarEntry,
  type CalendarEntryKind,
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
  kind: CalendarEntryKind
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

  // Opened from a work order or an appointment, only that kind of work can be added; on the Jobs screen both can.
  const addActions = useMemo<CalendarAddAction[]>(() => {
    const addToOrder: CalendarAddAction = {
      key: 'order',
      label: t('jobs.addJobPopup.addJobToOrder'),
      onSelect: ({ rowId, minutes, dateIso }) =>
        setAddJobRequest({ kind: 'order', technicianId: rowId, dateIso: dateIso ?? selectedDate, minutes }),
    }
    const addToAppointment: CalendarAddAction = {
      key: 'appointment',
      label: t('jobs.addJobPopup.addJobToAppointment'),
      onSelect: ({ rowId, minutes, dateIso }) =>
        setAddJobRequest({ kind: 'appointment', technicianId: rowId, dateIso: dateIso ?? selectedDate, minutes }),
    }

    switch (mode.kind) {
      case 'addToOrder':
        return [addToOrder]
      case 'addToAppointment':
        return [addToAppointment]
      default:
        return [addToOrder, addToAppointment]
    }
  }, [mode.kind, selectedDate, t])

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

      {addJobRequest?.kind === 'order' && (
        <AddJobModal
          open
          technicianId={addJobRequest.technicianId}
          dateIso={addJobRequest.dateIso}
          minutes={addJobRequest.minutes}
          lockedOrder={mode.kind === 'addToOrder' ? mode.order : undefined}
          onCreated={onCreated}
          onClose={() => setAddJobRequest(null)}
        />
      )}

      {addJobRequest?.kind === 'appointment' && (
        <AddAppointmentJobModal
          open
          technicianId={addJobRequest.technicianId}
          dateIso={addJobRequest.dateIso}
          minutes={addJobRequest.minutes}
          lockedAppointment={mode.kind === 'addToAppointment' ? mode.appointment : undefined}
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
