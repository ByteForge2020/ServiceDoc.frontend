import { useState, type MouseEvent as ReactMouseEvent } from 'react'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import { alpha } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import { useShopTimeZone } from '../../../app/shop/useShopTimeZone'
import type { Job } from '../types'
import { PX_PER_MINUTE } from '../gridConstants'
import { formatTimeRange, utcIsoToMinutesOfDay } from '../timeUtils'

interface JobCardProps {
  job: Job
  onEdit: (job: Job) => void
  onDelete: (job: Job) => void
  onHoverStart?: () => void
}

export function JobCard({ job, onEdit, onDelete, onHoverStart }: JobCardProps) {
  const { t } = useTranslation()
  const zone = useShopTimeZone()
  const [hovered, setHovered] = useState(false)
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const menuOpen = !!menuAnchor

  const startMinutes = utcIsoToMinutesOfDay(job.scheduledTime, zone)
  const left = startMinutes * PX_PER_MINUTE
  const width = Math.max(job.scheduledDurationMinutes * PX_PER_MINUTE, 8)

  function handleMenuOpen(event: ReactMouseEvent<HTMLElement>) {
    event.stopPropagation()
    setMenuAnchor(event.currentTarget)
  }

  function handleMenuClose() {
    setMenuAnchor(null)
  }

  function handleEditClick(event: ReactMouseEvent<HTMLElement>) {
    event.stopPropagation()
    setMenuAnchor(null)
    onEdit(job)
  }

  function handleDeleteClick(event: ReactMouseEvent<HTMLElement>) {
    event.stopPropagation()
    setMenuAnchor(null)
    onDelete(job)
  }

  return (
    <Box
      onMouseEnter={() => {
        setHovered(true)
        onHoverStart?.()
      }}
      onMouseLeave={() => setHovered(false)}
      onMouseMove={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      sx={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        left,
        width,
        borderRadius: '6px',
        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
        border: '1px solid',
        borderColor: 'primary.light',
        overflow: 'hidden',
        px: 1,
        py: '2px',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '2px' }}>
        <Typography variant="body2" noWrap sx={{ fontWeight: 600, color: 'primary.dark' }}>
          #{job.orderNumber}
        </Typography>
        <IconButton
          size="small"
          aria-label={t('jobs.jobCard.menuAria')}
          onClick={handleMenuOpen}
          sx={{ p: '2px', flexShrink: 0, opacity: hovered || menuOpen ? 1 : 0 }}
        >
          <MoreVertIcon fontSize="inherit" />
        </IconButton>
      </Box>
      <Typography variant="caption" noWrap component="div">
        {job.estimateItemName ?? formatTimeRange(job.scheduledTime, job.scheduledDurationMinutes, zone)}
      </Typography>

      <Menu anchorEl={menuAnchor} open={menuOpen} onClose={handleMenuClose}>
        <MenuItem onClick={handleEditClick}>{t('jobs.jobCard.editJob')}</MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          {t('jobs.jobCard.deleteJob')}
        </MenuItem>
      </Menu>
    </Box>
  )
}
