import { useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import { useTranslation } from 'react-i18next'
import { extractErrorMessage } from '../../../api/errorMessage'
import { useConfirm } from '../../../app/confirm/useConfirm'
import { useShopTimeZone } from '../../../app/shop/useShopTimeZone'
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
import { technicianDisplayName } from '../technicianUtils'
import { useFocusedEntryCheck } from '../useFocusedEntryCheck'
import { localDateAndMinutesToUtcIso } from '../../../utils/timeGrid'
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

interface AddJobRequest {
  kind: CalendarEntryKind
  technicianId: string
  technicianName: string
  minutes: number
}

/** The technicians calendar: one row per technician; work orders' jobs and appointments' jobs as entries. */
export function TechniciansTab({
  selectedDate,
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
  const zone = useShopTimeZone()
  const [addJobRequest, setAddJobRequest] = useState<AddJobRequest | null>(null)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [editingAppointmentJob, setEditingAppointmentJob] = useState<AppointmentJob | null>(null)
  const deleteJobMutation = useDeleteJobMutation()
  const rescheduleJobMutation = useRescheduleJobMutation()
  const deleteAppointmentJobMutation = useDeleteAppointmentJobMutation()
  const rescheduleAppointmentJobMutation = useRescheduleAppointmentJobMutation()

  const { from, to } = useMemo(() => {
    return {
      from: localDateAndMinutesToUtcIso(selectedDate, 0, zone),
      to: localDateAndMinutesToUtcIso(selectedDate, 24 * 60, zone),
    }
  }, [selectedDate, zone])

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
      onSelect: ({ rowId, rowName, minutes }) =>
        setAddJobRequest({ kind: 'order', technicianId: rowId, technicianName: rowName, minutes }),
    }
    const addToAppointment: CalendarAddAction = {
      key: 'appointment',
      label: t('jobs.addJobPopup.addJobToAppointment'),
      onSelect: ({ rowId, rowName, minutes }) =>
        setAddJobRequest({ kind: 'appointment', technicianId: rowId, technicianName: rowName, minutes }),
    }

    switch (mode.kind) {
      case 'addToOrder':
        return [addToOrder]
      case 'addToAppointment':
        return [addToAppointment]
      default:
        return [addToOrder, addToAppointment]
    }
  }, [mode.kind, t])

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

  return (
    <>
      <ResourceCalendar
        rows={rows}
        entries={entries}
        selectedDate={selectedDate}
        onShiftDate={onShiftDate}
        mode={mode}
        maxHeight={maxHeight}
        emptyRowsText={t('jobs.noTechnicians')}
        addActions={addActions}
        entryLabels={{
          menuAria: t('jobs.jobCard.menuAria'),
          edit: t('jobs.jobCard.editJob'),
          delete: t('jobs.jobCard.deleteJob'),
        }}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onMove={handleMove}
      />

      {addJobRequest?.kind === 'order' && (
        <AddJobModal
          open
          technicianId={addJobRequest.technicianId}
          technicianName={addJobRequest.technicianName}
          dateIso={selectedDate}
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
          technicianName={addJobRequest.technicianName}
          dateIso={selectedDate}
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
