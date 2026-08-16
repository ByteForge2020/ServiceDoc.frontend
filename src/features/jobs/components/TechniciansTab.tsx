import { useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import { useTranslation } from 'react-i18next'
import { extractErrorMessage } from '../../../api/errorMessage'
import { useConfirm } from '../../../app/confirm/useConfirm'
import { useShopTimeZone } from '../../../app/shop/useShopTimeZone'
import { useToasters } from '../../../app/toasters/useToasters'
import { useTeamMembersQuery } from '../../settings/teamMembers/queries'
import { useDeleteJobMutation, useJobsQuery } from '../queries'
import { localDateAndMinutesToUtcIso } from '../timeUtils'
import type { Job } from '../types'
import { TechniciansGrid } from './TechniciansGrid'
import { AddJobModal } from './AddJobModal'
import { EditJobModal } from './EditJobModal'

interface TechniciansTabProps {
  selectedDate: string
}

interface AddJobRequest {
  technicianId: string
  technicianName: string
  minutes: number
}

export function TechniciansTab({ selectedDate }: TechniciansTabProps) {
  const { t } = useTranslation()
  const toasters = useToasters()
  const confirm = useConfirm()
  const zone = useShopTimeZone()
  const [addJobRequest, setAddJobRequest] = useState<AddJobRequest | null>(null)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const deleteJobMutation = useDeleteJobMutation()

  const { from, to } = useMemo(() => {
    return {
      from: localDateAndMinutesToUtcIso(selectedDate, 0, zone),
      to: localDateAndMinutesToUtcIso(selectedDate, 24 * 60, zone),
    }
  }, [selectedDate, zone])

  const { data: technicians, isPending: isTechniciansPending } = useTeamMembersQuery()
  const { data: jobs, isPending: isJobsPending } = useJobsQuery(from, to)

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
      },
      onError: (error) => {
        toasters.error(extractErrorMessage(error, t('jobs.jobCard.deleteError')))
      },
    })
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
      <TechniciansGrid
        technicians={technicians ?? []}
        jobs={jobs ?? []}
        onAddJob={setAddJobRequest}
        onEditJob={setEditingJob}
        onDeleteJob={handleDeleteJob}
      />

      {addJobRequest && (
        <AddJobModal
          open
          technicianId={addJobRequest.technicianId}
          technicianName={addJobRequest.technicianName}
          dateIso={selectedDate}
          minutes={addJobRequest.minutes}
          onClose={() => setAddJobRequest(null)}
        />
      )}

      {editingJob && <EditJobModal open job={editingJob} onClose={() => setEditingJob(null)} />}
    </>
  )
}
