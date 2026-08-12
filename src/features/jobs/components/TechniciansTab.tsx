import { useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import { DateTime } from 'luxon'
import { useTeamMembersQuery } from '../../settings/teamMembers/queries'
import { useJobsQuery } from '../queries'
import { TechniciansGrid } from './TechniciansGrid'
import { AddJobModal } from './AddJobModal'

interface TechniciansTabProps {
  selectedDate: string
}

interface AddJobRequest {
  technicianId: string
  technicianName: string
  minutes: number
}

export function TechniciansTab({ selectedDate }: TechniciansTabProps) {
  const [addJobRequest, setAddJobRequest] = useState<AddJobRequest | null>(null)

  const { from, to } = useMemo(() => {
    const start = DateTime.fromISO(selectedDate, { zone: 'utc' })
    return { from: start.toISO()!, to: start.plus({ days: 1 }).toISO()! }
  }, [selectedDate])

  const { data: technicians, isPending: isTechniciansPending } = useTeamMembersQuery()
  const { data: jobs, isPending: isJobsPending } = useJobsQuery(from, to)

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
    </>
  )
}
