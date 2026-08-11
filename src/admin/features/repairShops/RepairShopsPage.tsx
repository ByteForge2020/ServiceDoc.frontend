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
import { useNavigate } from 'react-router-dom'
import { useRepairShopsQuery } from './queries'

function formatDate(value: string): string {
  return DateTime.fromISO(value).toLocaleString(DateTime.DATETIME_MED)
}

export function RepairShopsPage() {
  const navigate = useNavigate()
  const { data: repairShops, isPending, refetch, isFetching } = useRepairShopsQuery()

  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h2" component="h1">
          Repair Shops
        </Typography>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <IconButton onClick={() => refetch()} disabled={isFetching} aria-label="Refresh">
            <RefreshIcon />
          </IconButton>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/shops/new')}>
            New repair shop
          </Button>
        </Stack>
      </Stack>

      {isPending && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {repairShops && (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '12px' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Subdomain</TableCell>
                <TableCell>Address</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Created</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {repairShops.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body2" sx={{ color: 'text.secondary', py: 2 }}>
                      No repair shops yet
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {repairShops.map((repairShop) => (
                <TableRow
                  key={repairShop.id}
                  hover
                  onClick={() => navigate(`/shops/${repairShop.id}`)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>{repairShop.name}</TableCell>
                  <TableCell>{repairShop.subdomainName}</TableCell>
                  <TableCell>{repairShop.address ?? '—'}</TableCell>
                  <TableCell>{repairShop.phone ?? '—'}</TableCell>
                  <TableCell>{formatDate(repairShop.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Stack>
  )
}
