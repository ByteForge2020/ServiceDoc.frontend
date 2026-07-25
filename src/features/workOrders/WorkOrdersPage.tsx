import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { DateTime } from 'luxon'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useWorkOrdersQuery } from './queries'
import { WorkOrderStatusChip } from './WorkOrderStatusChip'

function formatDate(value: string | null): string {
  if (!value) {
    return '—'
  }
  return DateTime.fromISO(value).toLocaleString(DateTime.DATETIME_MED)
}

export function WorkOrdersPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: workOrders, isPending, refetch, isFetching } = useWorkOrdersQuery()

  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h2" component="h1">
          {t('workOrders.title')}
        </Typography>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <IconButton onClick={() => refetch()} disabled={isFetching} aria-label={t('workOrders.refreshAria')}>
            <RefreshIcon />
          </IconButton>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/orders/new')}>
            {t('workOrders.newWorkOrder')}
          </Button>
        </Stack>
      </Stack>

      {isPending && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {workOrders && (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '12px' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('workOrders.table.orderNumber')}</TableCell>
                <TableCell>{t('workOrders.table.status')}</TableCell>
                <TableCell>{t('workOrders.table.customer')}</TableCell>
                <TableCell>{t('workOrders.table.vehicle')}</TableCell>
                <TableCell>{t('workOrders.table.notes')}</TableCell>
                <TableCell>{t('workOrders.table.opened')}</TableCell>
                <TableCell>{t('workOrders.table.closed')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {workOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" sx={{ color: 'text.secondary', py: 2 }}>
                      {t('workOrders.noWorkOrders')}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {workOrders.map((workOrder) => (
                <TableRow
                  key={workOrder.id}
                  hover
                  onClick={() => navigate(`/orders/${workOrder.id}`)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>{workOrder.orderNumber}</TableCell>
                  <TableCell>
                    <WorkOrderStatusChip status={workOrder.status} />
                  </TableCell>
                  <TableCell>{workOrder.customerName ?? '—'}</TableCell>
                  <TableCell>{workOrder.vehicleDescription ?? '—'}</TableCell>
                  <TableCell>{workOrder.notes ?? '—'}</TableCell>
                  <TableCell>{formatDate(workOrder.openedAt)}</TableCell>
                  <TableCell>{formatDate(workOrder.closedAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Stack>
  )
}
