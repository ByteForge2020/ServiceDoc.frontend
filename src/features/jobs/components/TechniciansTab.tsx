import { useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import { useTranslation } from 'react-i18next'
import { extractErrorMessage } from '../../../api/errorMessage'
import { useConfirm } from '../../../app/confirm/useConfirm'
import { useShopTimeZone } from '../../../app/shop/useShopTimeZone'
import { useToasters } from '../../../app/toasters/useToasters'
import { useTeamMembersQuery } from '../../settings/teamMembers/queries'
import { useDeleteJobMutation, useJobsQuery, useRescheduleJobMutation } from '../queries'
import { technicianDisplayName } from '../technicianUtils'
import { useFocusedEntryCheck } from '../useFocusedEntryCheck'
import { localDateAndMinutesToUtcIso } from '../../../utils/timeGrid'
import { FREE_MODE, jobToCalendarEntry, type CalendarEntry, type CalendarTabProps, type Job } from '../types'
import { AddJobModal } from './AddJobModal'
import { EditJobModal } from './EditJobModal'
import { ResourceCalendar } from './ResourceCalendar'

interface AddJobRequest {
  technicianId: string
  technicianName: string
  minutes: number
}

/** The technicians calendar: one row per technician, jobs as entries. */
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
  const deleteJobMutation = useDeleteJobMutation()
  const rescheduleJobMutation = useRescheduleJobMutation()

  const { from, to } = useMemo(() => {
    return {
      from: localDateAndMinutesToUtcIso(selectedDate, 0, zone),
      to: localDateAndMinutesToUtcIso(selectedDate, 24 * 60, zone),
    }
  }, [selectedDate, zone])

  const { data: technicians, isPending: isTechniciansPending } = useTeamMembersQuery()
  const { data: jobs, isPending: isJobsPending, isPlaceholderData } = useJobsQuery(from, to)

  const rows = useMemo(
    () => (technicians ?? []).map((member) => ({ id: member.id, name: technicianDisplayName(member) })),
    [technicians],
  )
  const entries = useMemo(() => (jobs ?? []).map(jobToCalendarEntry), [jobs])

  useFocusedEntryCheck(
    mode,
    !isJobsPending && !isTechniciansPending && !isPlaceholderData,
    entries,
    rows,
    onFocusMissing,
  )

  async function handleDelete(entry: CalendarEntry) {
    const confirmed = await confirm({
      message: t('jobs.jobCard.deleteConfirmMessage', { orderNumber: entry.orderNumber }),
      confirmLabel: t('jobs.jobCard.deleteJob'),
      destructive: true,
    })

    if (!confirmed) {
      return
    }

    deleteJobMutation.mutate(entry.id, {
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
    rescheduleJobMutation.mutate(
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

  if (isTechniciansPending || isJobsPending) {
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
        addLabel={t('jobs.addJobPopup.addJobToOrder')}
        entryLabels={{
          menuAria: t('jobs.jobCard.menuAria'),
          edit: t('jobs.jobCard.editJob'),
          delete: t('jobs.jobCard.deleteJob'),
        }}
        onAdd={({ rowId, rowName, minutes }) =>
          setAddJobRequest({ technicianId: rowId, technicianName: rowName, minutes })
        }
        onEdit={(entry) => setEditingJob(jobs?.find((job) => job.id === entry.id) ?? null)}
        onDelete={handleDelete}
        onMove={handleMove}
      />

      {addJobRequest && (
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

      {editingJob && (
        <EditJobModal open job={editingJob} onUpdated={onUpdated} onClose={() => setEditingJob(null)} />
      )}
    </>
  )
}
