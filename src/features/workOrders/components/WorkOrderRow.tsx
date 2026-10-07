import { useState } from 'react'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Collapse from '@mui/material/Collapse'
import IconButton from '@mui/material/IconButton'
import Avatar from '@mui/material/Avatar'
import TableCell from '@mui/material/TableCell'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import ScheduleIcon from '@mui/icons-material/Schedule'
import { DateTime } from 'luxon'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useShopTimeZone } from '../../../app/shop/useShopTimeZone'
import { formatScheduledRange } from '../../../utils/timeGrid'
import type { WorkOrder } from '../types'

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

function formatDate(value: string | null, zone: string): string {
  if (!value) {
    return '—'
  }
  return DateTime.fromISO(value, { zone: 'utc' }).setZone(zone).toLocaleString(DateTime.DATETIME_MED)
}

interface WorkOrderRowProps {
  workOrder: WorkOrder
}

export function WorkOrderRow({ workOrder }: WorkOrderRowProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const zone = useShopTimeZone()
  const [open, setOpen] = useState(false)
  const hasJobs = workOrder.jobs.length > 0

  return (
    <>
      <TableRow hover onClick={() => navigate(`/orders/${workOrder.id}`)} sx={{ cursor: 'pointer' }}>
        <TableCell sx={{ width: 48 }}>
          {hasJobs && (
            <IconButton
              size="small"
              aria-label={open ? t('workOrders.table.collapseAria') : t('workOrders.table.expandAria')}
              onClick={(event) => {
                event.stopPropagation()
                setOpen((prev) => !prev)
              }}
            >
              <KeyboardArrowRightIcon
                fontSize="small"
                sx={{ transition: 'transform 0.2s', transform: open ? 'rotate(90deg)' : 'none' }}
              />
            </IconButton>
          )}
        </TableCell>
        <TableCell>{workOrder.orderNumber}</TableCell>
        <TableCell>
          <Chip size="small" label={workOrder.phaseName} />
        </TableCell>
        <TableCell>{workOrder.customerName ?? '—'}</TableCell>
        <TableCell>{workOrder.vehicleDescription ?? '—'}</TableCell>
        <TableCell>{workOrder.notes ?? '—'}</TableCell>
        <TableCell>{formatDate(workOrder.openedAt, zone)}</TableCell>
        <TableCell>{formatDate(workOrder.closedAt, zone)}</TableCell>
      </TableRow>

      {hasJobs && (
        <TableRow>
          <TableCell sx={{ py: 0, bgcolor: 'action.hover', borderBottom: open ? undefined : 'none' }} colSpan={8}>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Box
                sx={{
                  my: 1.5,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: 1.5,
                }}
              >
                {workOrder.jobs.map((job) => (
                  <Box
                    key={job.id}
                    sx={{
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
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {job.estimateItemName ?? t('workOrders.jobsTable.noDescription')}
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
                  </Box>
                ))}
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}
