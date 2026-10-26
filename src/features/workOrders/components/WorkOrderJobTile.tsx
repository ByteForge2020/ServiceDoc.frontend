import { useState } from 'react'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import ScheduleIcon from '@mui/icons-material/Schedule'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { useShopTimeZone } from '../../../app/shop/useShopTimeZone'
import { formatScheduledRange } from '../../../utils/timeGrid'
import type { JobSummary } from '../types'

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

interface WorkOrderJobTileProps {
  job: JobSummary
  onEdit: (job: JobSummary) => void
  onDelete: (job: JobSummary) => void
}

/** One scheduled job of a work order, with an Edit / Delete menu that appears on hover. */
export function WorkOrderJobTile({ job, onEdit, onDelete }: WorkOrderJobTileProps) {
  const { t } = useTranslation()
  const zone = useShopTimeZone()
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const menuOpen = !!menuAnchor

  return (
    <Box
      sx={{
        position: 'relative',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderLeft: '3px solid',
        borderLeftColor: 'primary.main',
        borderRadius: '8px',
        // The menu button shows on hover; touch screens have no hover, so it is always there.
        '& .job-tile-menu': { opacity: menuOpen ? 1 : 0 },
        '&:hover .job-tile-menu, &:focus-within .job-tile-menu': { opacity: 1 },
        '@media (hover: none)': { '& .job-tile-menu': { opacity: 1 } },
      }}
    >
      <IconButton
        className="job-tile-menu"
        size="small"
        aria-label={t('jobs.jobCard.menuAria')}
        onClick={(event) => setMenuAnchor(event.currentTarget)}
        sx={{ position: 'absolute', top: 8, right: 8 }}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>

      <Typography variant="body2" sx={{ fontWeight: 600, pr: 4, overflowWrap: 'anywhere' }}>
        {job.descriptions.length > 0 ? job.descriptions.join(', ') : t('workOrders.jobsTable.noDescription')}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Avatar sx={{ width: 22, height: 22, fontSize: 11, bgcolor: 'primary.main' }}>
          {initials(job.assignedUserName)}
        </Avatar>
        <Typography variant="body2">{job.assignedUserName}</Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
        <ScheduleIcon sx={{ fontSize: 18 }} />
        <Typography variant="body2">
          {formatScheduledRange(job.scheduledTime, job.scheduledDurationMinutes, zone)}
        </Typography>
      </Box>

      <Menu anchorEl={menuAnchor} open={menuOpen} onClose={() => setMenuAnchor(null)}>
        <MenuItem
          onClick={() => {
            setMenuAnchor(null)
            onEdit(job)
          }}
        >
          {t('jobs.jobCard.editJob')}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setMenuAnchor(null)
            onDelete(job)
          }}
          sx={{ color: 'error.main' }}
        >
          {t('jobs.jobCard.deleteJob')}
        </MenuItem>
      </Menu>
    </Box>
  )
}
