import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import { useTheme } from '@mui/material/styles'
import { DateTime } from 'luxon'
import { useTranslation } from 'react-i18next'
import { extractErrorMessage } from '../../../api/errorMessage'
import { useConfirm } from '../../../app/confirm/useConfirm'
import { useShopTimeZone } from '../../../app/shop/useShopTimeZone'
import { useToasters } from '../../../app/toasters/useToasters'
import { useTeamMembersQuery } from '../../settings/teamMembers/queries'
import { MINUTES_PER_DAY, PX_PER_MINUTE, SNAP_MINUTES } from '../gridConstants'
import { useDeleteJobMutation, useJobsQuery, useRescheduleJobMutation } from '../queries'
import { JOB_CARD_ATTRIBUTE, TIMELINE_ATTRIBUTE, technicianDisplayName } from '../technicianUtils'
import { useDragEdgeNavigation } from '../useDragEdgeNavigation'
import { localDateAndMinutesToUtcIso, offsetXToMinutes, snapMinutes } from '../../../utils/timeGrid'
import { FREE_MODE, type CalendarMode, type Job } from '../types'
import { EdgeIndicator } from './EdgeIndicator'
import { JobCardPreview } from './JobCard'
import { TechniciansGrid } from './TechniciansGrid'
import { AddJobModal } from './AddJobModal'
import { EditJobModal } from './EditJobModal'

export interface TechniciansTabProps {
  selectedDate: string
  /** Called when a dragged job rests at a screen edge: moves the calendar one day back (-1) or forward (1). */
  onShiftDate: (direction: -1 | 1) => void
  mode?: CalendarMode
  /** Height the grid may grow to before it scrolls; defaults to a full page. */
  maxHeight?: string
  onJobCreated?: () => void
  onJobUpdated?: () => void
  onJobDeleted?: (job: Job) => void
  /** In `editJob` mode: the job to edit can't be shown (deleted, or its technician is gone). */
  onFocusJobMissing?: () => void
}

interface DropTarget {
  technicianId: string
  minutes: number
}

interface AddJobRequest {
  technicianId: string
  technicianName: string
  minutes: number
}

export function TechniciansTab({
  selectedDate,
  onShiftDate,
  mode = FREE_MODE,
  maxHeight,
  onJobCreated,
  onJobUpdated,
  onJobDeleted,
  onFocusJobMissing,
}: TechniciansTabProps) {
  const { t, i18n } = useTranslation()
  const toasters = useToasters()
  const confirm = useConfirm()
  const zone = useShopTimeZone()
  const [addJobRequest, setAddJobRequest] = useState<AddJobRequest | null>(null)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const deleteJobMutation = useDeleteJobMutation()
  const rescheduleJobMutation = useRescheduleJobMutation()
  const theme = useTheme()
  const [draggedJob, setDraggedJob] = useState<Job | null>(null)
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null)
  const grabOffsetXRef = useRef(0)
  const overIdRef = useRef<string | null>(null)
  const focusCheckedRef = useRef(false)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const { pointerXRef, edge } = useDragEdgeNavigation(
    draggedJob !== null,
    onShiftDate,
    (pointerX) => updateDropTarget(overIdRef.current, pointerX),
  )

  const { from, to } = useMemo(() => {
    return {
      from: localDateAndMinutesToUtcIso(selectedDate, 0, zone),
      to: localDateAndMinutesToUtcIso(selectedDate, 24 * 60, zone),
    }
  }, [selectedDate, zone])

  const { data: technicians, isPending: isTechniciansPending } = useTeamMembersQuery()
  const { data: jobs, isPending: isJobsPending, isPlaceholderData } = useJobsQuery(from, to)

  const focusJobId = mode.kind === 'editJob' ? mode.jobId : null

  // Checked once, on the first real load (which is for the job's own date): the job may have been deleted since the
  // list was rendered, or belong to a technician that is no longer listed, so there is nothing to edit in the grid.
  useEffect(() => {
    if (!focusJobId || focusCheckedRef.current || isJobsPending || isTechniciansPending || isPlaceholderData) {
      return
    }

    focusCheckedRef.current = true
    const job = jobs?.find((item) => item.id === focusJobId)
    if (!job || !technicians?.some((member) => member.id === job.assignedUserId)) {
      onFocusJobMissing?.()
    }
  }, [focusJobId, jobs, technicians, isJobsPending, isTechniciansPending, isPlaceholderData, onFocusJobMissing])

  function isJobEditable(job: Job): boolean {
    switch (mode.kind) {
      case 'free':
        return true
      case 'addToOrder':
        return false
      case 'editJob':
        return job.id === mode.jobId
    }
  }

  async function handleDeleteJob(job: Job) {
    const confirmed = await confirm({
      message: t('jobs.jobCard.deleteConfirmMessage', { orderNumber: job.orderNumber }),
      confirmLabel: t('jobs.jobCard.deleteJob'),
      destructive: true,
    })

    if (!confirmed) {
      return
    }

    deleteJobMutation.mutate(job.id, {
      onSuccess: () => {
        toasters.success(t('jobs.jobCard.deleteSuccess'))
        onJobDeleted?.(job)
      },
      onError: (error) => {
        toasters.error(extractErrorMessage(error, t('jobs.jobCard.deleteError')))
      },
    })
  }

  // The card's left edge follows the pointer (minus where it was grabbed), so that edge decides the start time.
  // The row is measured from the DOM now rather than from dnd-kit's cached rects, so scrolling can't skew it.
  function resolveDropTarget(overId: string | null, pointerX: number): DropTarget | null {
    const timeline = overId && document.querySelector(`[${TIMELINE_ATTRIBUTE}="${CSS.escape(overId)}"]`)
    if (!overId || !timeline) {
      return null
    }

    const cardLeft = pointerX - grabOffsetXRef.current
    const minutes = snapMinutes(
      offsetXToMinutes(cardLeft - timeline.getBoundingClientRect().left, PX_PER_MINUTE),
      SNAP_MINUTES,
      MINUTES_PER_DAY,
    )
    return { technicianId: overId, minutes }
  }

  function updateDropTarget(overId: string | null, pointerX: number) {
    const next = resolveDropTarget(overId, pointerX)
    setDropTarget((previous) =>
      previous?.technicianId === next?.technicianId && previous?.minutes === next?.minutes ? previous : next,
    )
  }

  function adjacentDayLabel(offsetDays: number): string {
    return DateTime.fromISO(selectedDate, { zone: 'utc' })
      .plus({ days: offsetDays })
      .setLocale(i18n.language)
      .toFormat('ccc, d LLL')
  }

  function finishDrag() {
    overIdRef.current = null
    setDraggedJob(null)
    setDropTarget(null)
  }

  function handleDragStart({ active, activatorEvent }: DragStartEvent) {
    const job = active.data.current?.job as Job | undefined
    if (!job) {
      return
    }
    const startPointerX = activatorEvent instanceof PointerEvent ? activatorEvent.clientX : 0
    const card = activatorEvent.target instanceof Element ? activatorEvent.target.closest(`[${JOB_CARD_ATTRIBUTE}]`) : null
    const cardLeft = card?.getBoundingClientRect().left ?? active.rect.current.initial?.left ?? startPointerX
    pointerXRef.current = startPointerX
    grabOffsetXRef.current = startPointerX - cardLeft
    setDraggedJob(job)
  }

  function handleDragOver({ over }: DragOverEvent) {
    overIdRef.current = over ? String(over.id) : null
    updateDropTarget(overIdRef.current, pointerXRef.current)
  }

  function handleDragEnd({ over }: DragEndEvent) {
    const job = draggedJob
    finishDrag()

    const target = resolveDropTarget(over ? String(over.id) : null, pointerXRef.current)
    const technician = technicians?.find((member) => member.id === target?.technicianId)
    if (!job || !target || !technician) {
      return
    }

    const { minutes } = target
    const scheduledTime = localDateAndMinutesToUtcIso(selectedDate, minutes, zone)

    const isUnchanged =
      job.assignedUserId === technician.id &&
      DateTime.fromISO(job.scheduledTime).toMillis() === DateTime.fromISO(scheduledTime).toMillis()
    if (isUnchanged) {
      return
    }

    rescheduleJobMutation.mutate(
      {
        id: job.id,
        assignedUserId: technician.id,
        assignedUserName: technicianDisplayName(technician),
        scheduledTime,
      },
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
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        // The screen edges change the date instead, so only the grid's vertical scroll follows the pointer.
        autoScroll={{ threshold: { x: 0, y: 0.2 } }}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={finishDrag}
      >
        <TechniciansGrid
          technicians={technicians ?? []}
          jobs={jobs ?? []}
          dropPlaceholder={
            draggedJob && dropTarget
              ? { ...dropTarget, durationMinutes: draggedJob.scheduledDurationMinutes }
              : null
          }
          isJobEditable={isJobEditable}
          canAddJobs={mode.kind !== 'editJob'}
          focusJobId={mode.kind === 'editJob' ? mode.jobId : undefined}
          maxHeight={maxHeight}
          onAddJob={setAddJobRequest}
          onEditJob={setEditingJob}
          onDeleteJob={handleDeleteJob}
        />

        {/* Portaled and raised so it also shows above a dialog when the calendar is opened in one. */}
        {createPortal(
          <DragOverlay dropAnimation={null} zIndex={theme.zIndex.modal + 100}>
            {draggedJob && <JobCardPreview job={draggedJob} />}
          </DragOverlay>,
          document.body,
        )}
      </DndContext>

      {draggedJob &&
        createPortal(
          <>
            <EdgeIndicator side="left" active={edge === -1} label={adjacentDayLabel(-1)} />
            <EdgeIndicator side="right" active={edge === 1} label={adjacentDayLabel(1)} />
          </>,
          document.body,
        )}

      {addJobRequest && (
        <AddJobModal
          open
          technicianId={addJobRequest.technicianId}
          technicianName={addJobRequest.technicianName}
          dateIso={selectedDate}
          minutes={addJobRequest.minutes}
          lockedOrder={mode.kind === 'addToOrder' ? mode.order : undefined}
          onCreated={onJobCreated}
          onClose={() => setAddJobRequest(null)}
        />
      )}

      {editingJob && (
        <EditJobModal open job={editingJob} onUpdated={onJobUpdated} onClose={() => setEditingJob(null)} />
      )}
    </>
  )
}
