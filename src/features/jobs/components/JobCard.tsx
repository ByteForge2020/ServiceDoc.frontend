import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { alpha } from '@mui/material/styles'
import type { Job } from '../types'
import { PX_PER_MINUTE } from '../gridConstants'
import { formatTimeRange, utcIsoToMinutesOfDay } from '../timeUtils'

interface JobCardProps {
  job: Job
}

export function JobCard({ job }: JobCardProps) {
  const startMinutes = utcIsoToMinutesOfDay(job.scheduledTime)
  const left = startMinutes * PX_PER_MINUTE
  const width = Math.max(job.scheduledDurationMinutes * PX_PER_MINUTE, 8)

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 6,
        bottom: 6,
        left,
        width,
        borderRadius: '6px',
        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
        border: '1px solid',
        borderColor: 'primary.light',
        overflow: 'hidden',
        px: 1,
        py: '2px',
        pointerEvents: 'none',
      }}
    >
      <Typography variant="body2" noWrap sx={{ fontWeight: 600, color: 'primary.dark' }}>
        #{job.orderNumber}
      </Typography>
      <Typography variant="caption" noWrap component="div">
        {job.estimateItemName ?? formatTimeRange(job.scheduledTime, job.scheduledDurationMinutes)}
      </Typography>
    </Box>
  )
}
