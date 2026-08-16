import { useState } from 'react'
import Box from '@mui/material/Box'
import Collapse from '@mui/material/Collapse'
import IconButton from '@mui/material/IconButton'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import { DateTime } from 'luxon'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useShopTimeZone } from '../../../app/shop/useShopTimeZone'
import { formatScheduledRange } from '../../jobs/timeUtils'
import type { WorkOrder } from '../types'
import { WorkOrderStatusChip } from '../WorkOrderStatusChip'

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
              {open ? <KeyboardArrowDownIcon fontSize="small" /> : <KeyboardArrowRightIcon fontSize="small" />}
            </IconButton>
          )}
        </TableCell>
        <TableCell>{workOrder.orderNumber}</TableCell>
        <TableCell>
          <WorkOrderStatusChip status={workOrder.status} />
        </TableCell>
        <TableCell>{workOrder.customerName ?? '—'}</TableCell>
        <TableCell>{workOrder.vehicleDescription ?? '—'}</TableCell>
        <TableCell>{workOrder.notes ?? '—'}</TableCell>
        <TableCell>{formatDate(workOrder.openedAt, zone)}</TableCell>
        <TableCell>{formatDate(workOrder.closedAt, zone)}</TableCell>
      </TableRow>

      {hasJobs && (
        <TableRow>
          <TableCell sx={{ py: 0, borderBottom: open ? undefined : 'none' }} colSpan={8}>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Box sx={{ my: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('workOrders.jobsTable.description')}</TableCell>
                      <TableCell>{t('workOrders.jobsTable.assigned')}</TableCell>
                      <TableCell>{t('workOrders.jobsTable.scheduled')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {workOrder.jobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell>{job.estimateItemName ?? t('workOrders.jobsTable.noDescription')}</TableCell>
                        <TableCell>{job.assignedUserName}</TableCell>
                        <TableCell>{formatScheduledRange(job.scheduledTime, job.scheduledDurationMinutes, zone)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}
