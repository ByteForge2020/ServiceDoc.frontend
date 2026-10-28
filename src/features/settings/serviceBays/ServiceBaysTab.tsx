import { useState } from 'react'
import AddIcon from '@mui/icons-material/Add'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import RefreshIcon from '@mui/icons-material/Refresh'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { AxiosError } from 'axios'
import { useTranslation } from 'react-i18next'
import { extractErrorMessage } from '../../../api/errorMessage'
import type { ServiceBay } from '../../../api/serviceBaysApi'
import { useConfirm } from '../../../app/confirm/useConfirm'
import { useToasters } from '../../../app/toasters/useToasters'
import { ServiceBayFormModal } from './ServiceBayFormModal'
import {
  useCreateServiceBayMutation,
  useDeleteServiceBayMutation,
  useRenameServiceBayMutation,
  useServiceBaysQuery,
} from './queries'

/** The shop's own list of service bays (the places a vehicle can be booked into). */
export function ServiceBaysTab() {
  const { t } = useTranslation()
  const toasters = useToasters()
  const confirm = useConfirm()
  const { data: serviceBays, isPending, refetch, isFetching } = useServiceBaysQuery()
  const createMutation = useCreateServiceBayMutation()
  const renameMutation = useRenameServiceBayMutation()
  const deleteMutation = useDeleteServiceBayMutation()

  const [adding, setAdding] = useState(false)
  const [renaming, setRenaming] = useState<ServiceBay | null>(null)
  const [menu, setMenu] = useState<{ anchor: HTMLElement; serviceBay: ServiceBay } | null>(null)

  function reportError(error: unknown, fallbackKey: string) {
    if (error instanceof AxiosError && error.response?.status === 409) {
      toasters.error(t('serviceBays.nameConflict'))
      return
    }
    toasters.error(extractErrorMessage(error, t(fallbackKey)))
  }

  function handleCreate(name: string) {
    createMutation.mutate(name, {
      onSuccess: () => {
        toasters.success(t('serviceBays.createSuccess'))
        setAdding(false)
      },
      onError: (error) => reportError(error, 'serviceBays.createError'),
    })
  }

  function handleRename(name: string) {
    if (!renaming) {
      return
    }

    if (name === renaming.name) {
      setRenaming(null)
      return
    }

    renameMutation.mutate(
      { id: renaming.id, name },
      {
        onSuccess: () => {
          toasters.success(t('serviceBays.renameSuccess'))
          setRenaming(null)
        },
        onError: (error) => reportError(error, 'serviceBays.renameError'),
      },
    )
  }

  async function handleDelete(serviceBay: ServiceBay) {
    const confirmed = await confirm({
      message: t('serviceBays.deleteConfirmMessage', { name: serviceBay.name }),
      confirmLabel: t('serviceBays.delete'),
      destructive: true,
    })

    if (!confirmed) {
      return
    }

    deleteMutation.mutate(serviceBay.id, {
      onSuccess: () => toasters.success(t('serviceBays.deleteSuccess')),
      onError: (error) => toasters.error(extractErrorMessage(error, t('serviceBays.deleteError'))),
    })
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack spacing={1}>
          <Typography variant="h3" component="h2">
            {t('serviceBays.title')}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('serviceBays.description')}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <IconButton onClick={() => refetch()} disabled={isFetching} aria-label={t('serviceBays.refreshAria')}>
            <RefreshIcon />
          </IconButton>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAdding(true)}>
            {t('serviceBays.newServiceBay')}
          </Button>
        </Stack>
      </Stack>

      {isPending && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {serviceBays && (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '12px' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('serviceBays.table.name')}</TableCell>
                <TableCell sx={{ width: 64 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {serviceBays.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} align="center">
                    <Typography variant="body2" sx={{ color: 'text.secondary', py: 2 }}>
                      {t('serviceBays.noServiceBays')}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {serviceBays.map((serviceBay) => (
                <TableRow key={serviceBay.id} hover>
                  <TableCell>{serviceBay.name}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      aria-label={t('serviceBays.menuAria')}
                      onClick={(event) => setMenu({ anchor: event.currentTarget, serviceBay })}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Menu anchorEl={menu?.anchor ?? null} open={!!menu} onClose={() => setMenu(null)}>
        <MenuItem
          onClick={() => {
            setRenaming(menu?.serviceBay ?? null)
            setMenu(null)
          }}
        >
          {t('serviceBays.rename')}
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menu) {
              handleDelete(menu.serviceBay)
            }
            setMenu(null)
          }}
          sx={{ color: 'error.main' }}
        >
          {t('serviceBays.delete')}
        </MenuItem>
      </Menu>

      {adding && (
        <ServiceBayFormModal
          open
          title={t('serviceBays.addTitle')}
          initialName=""
          isSaving={createMutation.isPending}
          onClose={() => setAdding(false)}
          onSave={handleCreate}
        />
      )}

      {renaming && (
        <ServiceBayFormModal
          open
          title={t('serviceBays.renameTitle')}
          initialName={renaming.name}
          isSaving={renameMutation.isPending}
          onClose={() => setRenaming(null)}
          onSave={handleRename}
        />
      )}
    </Stack>
  )
}
