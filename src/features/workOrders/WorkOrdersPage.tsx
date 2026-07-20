import RefreshIcon from '@mui/icons-material/Refresh'
import Box from '@mui/material/Box'
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
import { useWorkOrdersQuery } from './queries'
import { WorkOrderStatusChip } from './WorkOrderStatusChip'

function formatDate(value: string | null): string {
  if (!value) {
    return '—'
  }
  return DateTime.fromISO(value).toLocaleString(DateTime.DATETIME_MED)
}

export function WorkOrdersPage() {
  const { data: workOrders, isPending, refetch, isFetching } = useWorkOrdersQuery()

  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h2" component="h1">
          Work orders
        </Typography>
        <IconButton onClick={() => refetch()} disabled={isFetching} aria-label="Refresh">
          <RefreshIcon />
        </IconButton>
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
                <TableCell>Status</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Vehicle</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell>Opened</TableCell>
                <TableCell>Closed</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {workOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" sx={{ color: 'text.secondary', py: 2 }}>
                      No work orders yet.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {workOrders.map((workOrder) => (
                <TableRow key={workOrder.id} hover>
                  <TableCell>
                    <WorkOrderStatusChip status={workOrder.status} />
                  </TableCell>
                  <TableCell>{workOrder.customerId}</TableCell>
                  <TableCell>{workOrder.vehicleId}</TableCell>
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
