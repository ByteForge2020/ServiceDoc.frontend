import AddIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
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
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useTeamMembersQuery } from './queries'

export function TeamMembersTab() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: teamMembers, isPending, refetch, isFetching } = useTeamMembersQuery()

  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h3" component="h2">
          {t('teamMembers.title')}
        </Typography>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <IconButton onClick={() => refetch()} disabled={isFetching} aria-label={t('teamMembers.refreshAria')}>
            <RefreshIcon />
          </IconButton>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/settings/team-members/new')}
          >
            {t('teamMembers.newTeamMember')}
          </Button>
        </Stack>
      </Stack>

      {isPending && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {teamMembers && (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '12px' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('teamMembers.table.name')}</TableCell>
                <TableCell>{t('teamMembers.table.email')}</TableCell>
                <TableCell>{t('teamMembers.table.role')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {teamMembers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    <Typography variant="body2" sx={{ color: 'text.secondary', py: 2 }}>
                      {t('teamMembers.noTeamMembers')}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {teamMembers.map((teamMember) => (
                <TableRow
                  key={teamMember.id}
                  hover
                  onClick={() => navigate(`/settings/team-members/${teamMember.id}`)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>{[teamMember.firstName, teamMember.lastName].filter(Boolean).join(' ') || '—'}</TableCell>
                  <TableCell>{teamMember.email}</TableCell>
                  <TableCell>
                    <Chip label={t(`teamMemberForm.roles.${teamMember.role.toLowerCase()}`)} size="small" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Stack>
  )
}
