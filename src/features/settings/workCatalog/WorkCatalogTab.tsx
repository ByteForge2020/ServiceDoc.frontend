import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import AddIcon from '@mui/icons-material/Add'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import SearchIcon from '@mui/icons-material/Search'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TablePagination from '@mui/material/TablePagination'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import type { Theme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import { AxiosError } from 'axios'
import { useTranslation } from 'react-i18next'
import { extractErrorMessage } from '../../../api/errorMessage'
import type { EstimateMasterListItem } from '../../../api/estimateMasterListApi'
import { useConfirm } from '../../../app/confirm/useConfirm'
import { useToasters } from '../../../app/toasters/useToasters'
import { CellField } from '../../../components/form/CellField'
import { HighlightedText } from '../../../components/HighlightedText'
import {
  useCreateEstimateMasterListItemMutation,
  useDeleteEstimateMasterListItemMutation,
  useEstimateMasterListPageQuery,
  useUpdateEstimateMasterListItemMutation,
} from '../../workOrders/estimateMasterListQueries'
import { useDebouncedValue } from '../../workOrders/components/useDebouncedValue'
import { toNullableNumber } from '../../workOrders/workOrderForm'

const MAX_NAME_LENGTH = 200
const SEARCH_DEBOUNCE_MS = 250
const SEARCH_WIDTH = 300
const PAGE_SIZE_OPTIONS = [10, 25, 50]

const COLUMN_WIDTHS = { name: '40%', amount: '15%', actions: '15%' }

// Tall enough for the edit row's inputs, so view and edit rows have the same height.
const ROW_SX = { height: (theme: Theme) => theme.spacing(6) }

// Inputs are taller than plain text, so the edit row drops its vertical cell padding and lets ROW_SX set the height.
const EDIT_ROW_SX = { ...ROW_SX, '& > .MuiTableCell-root': { py: 0 } }

const NEW_ROW = 'new'

interface Draft {
  name: string
  hours: string
  priceHr: string
  total: string
}

const EMPTY_DRAFT: Draft = { name: '', hours: '', priceHr: '', total: '' }

function toDraft(item: EstimateMasterListItem): Draft {
  return {
    name: item.name,
    hours: item.hours != null ? String(item.hours) : '',
    priceHr: item.priceHr != null ? String(item.priceHr) : '',
    total: item.total != null ? String(item.total) : '',
  }
}

// An empty amount is allowed (null); text that is not a non-negative number is an error, never silently dropped.
function isAmountInvalid(value: string): boolean {
  if (!value.trim()) {
    return false
  }

  const parsed = toNullableNumber(value)
  return parsed === null || parsed < 0
}

function formatAmount(value: number | null): string {
  return value != null ? String(value) : '—'
}

// "/" or Ctrl/Cmd+K focuses the search; "/" is ignored while typing somewhere so it stays a normal character.
function isFocusSearchShortcut(event: globalThis.KeyboardEvent): boolean {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    return true
  }

  if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) {
    return false
  }

  const target = event.target
  const isEditable =
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))

  return !isEditable
}

export function WorkCatalogTab() {
  const { t } = useTranslation()
  const toasters = useToasters()
  const confirm = useConfirm()
  const createMutation = useCreateEstimateMasterListItemMutation()
  const updateMutation = useUpdateEstimateMasterListItemMutation()
  const deleteMutation = useDeleteEstimateMasterListItemMutation()

  // Only one row is edited at a time: an existing item's id, NEW_ROW for the "add" row, or null.
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)
  // True when the server rejected the draft's name as a duplicate; cleared as soon as the name changes.
  const [nameConflict, setNameConflict] = useState(false)

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(PAGE_SIZE_OPTIONS[0])
  const searchRef = useRef<HTMLInputElement>(null)
  const debouncedSearch = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS)

  useEffect(() => {
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (isFocusSearchShortcut(event)) {
        event.preventDefault()
        searchRef.current?.focus()
        searchRef.current?.select()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  // Search and paging happen on the server. The server returns the last page when asked for one past the end
  // (e.g. after deleting the last row of the last page), so the page shown comes from the response, not from `page`.
  const { data, isPending, isPlaceholderData } = useEstimateMasterListPageQuery({
    search: debouncedSearch,
    page: page + 1,
    pageSize: rowsPerPage,
  })
  const pageItems = data?.items ?? []
  const totalCount = data?.totalCount ?? 0
  const currentPage = (data?.page ?? 1) - 1

  const nameTooLong = draft.name.length > MAX_NAME_LENGTH
  const saveDisabled =
    !draft.name.trim() ||
    nameTooLong ||
    isAmountInvalid(draft.hours) ||
    isAmountInvalid(draft.priceHr) ||
    isAmountInvalid(draft.total) ||
    createMutation.isPending ||
    updateMutation.isPending

  function reportError(error: unknown, fallbackKey: string) {
    if (error instanceof AxiosError && error.response?.status === 409) {
      // The red border on the name stays until the name is edited; the toast explains why.
      setNameConflict(true)
      toasters.error(t('workCatalog.nameConflict'))
      return
    }
    toasters.error(extractErrorMessage(error, t(fallbackKey)))
  }

  function startAdding(name = '') {
    setEditingId(NEW_ROW)
    setDraft({ ...EMPTY_DRAFT, name })
    setNameConflict(false)
  }

  // The edit row of an existing item can scroll out of view when the list changes; drop it. The "new" row is
  // always shown, so its draft is kept.
  function discardHiddenEdit() {
    if (editingId !== null && editingId !== NEW_ROW) {
      cancelEditing()
    }
  }

  function handleSearchChange(value: string) {
    discardHiddenEdit()
    setSearch(value)
    setPage(0)
  }

  function clearSearch() {
    handleSearchChange('')
    searchRef.current?.focus()
  }

  function handlePageChange(newPage: number) {
    discardHiddenEdit()
    setPage(newPage)
  }

  function handleRowsPerPageChange(value: number) {
    discardHiddenEdit()
    setRowsPerPage(value)
    setPage(0)
  }

  function startEditing(item: EstimateMasterListItem) {
    setEditingId(item.id)
    setDraft(toDraft(item))
    setNameConflict(false)
  }

  function cancelEditing() {
    setEditingId(null)
    setDraft(EMPTY_DRAFT)
    setNameConflict(false)
  }

  function handleSave() {
    if (saveDisabled || editingId === null) {
      return
    }

    const input = {
      name: draft.name.trim(),
      hours: toNullableNumber(draft.hours),
      priceHr: toNullableNumber(draft.priceHr),
      total: toNullableNumber(draft.total),
    }

    if (editingId === NEW_ROW) {
      createMutation.mutate(input, {
        onSuccess: cancelEditing,
        onError: (error) => reportError(error, 'workCatalog.createError'),
      })
      return
    }

    updateMutation.mutate(
      { id: editingId, input },
      {
        onSuccess: cancelEditing,
        onError: (error) => reportError(error, 'workCatalog.updateError'),
      },
    )
  }

  async function handleDelete(item: EstimateMasterListItem) {
    const confirmed = await confirm({
      message: t('workCatalog.deleteConfirmMessage', { name: item.name }),
      confirmLabel: t('workCatalog.delete'),
      destructive: true,
    })

    if (!confirmed) {
      return
    }

    deleteMutation.mutate(item.id, {
      onSuccess: () => {
        if (editingId === item.id) {
          cancelEditing()
        }
      },
      onError: (error) => toasters.error(extractErrorMessage(error, t('workCatalog.deleteError'))),
    })
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleSave()
    } else if (event.key === 'Escape') {
      cancelEditing()
    }
  }

  if (isPending || !data) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  function renderEditRow(key: string, autoFocusName: boolean) {
    return (
      <TableRow key={key} onKeyDown={handleKeyDown} sx={EDIT_ROW_SX}>
        <TableCell>
          <CellField
            value={draft.name}
            onChange={(name) => {
              setDraft((current) => ({ ...current, name }))
              setNameConflict(false)
            }}
            ariaLabel={t('estimate.name')}
            numeric={false}
            error={nameTooLong || nameConflict}
            placeholder={t('workCatalog.namePlaceholder')}
            autoFocus={autoFocusName}
          />
        </TableCell>
        <TableCell>
          <CellField
            value={draft.hours}
            onChange={(hours) => setDraft((current) => ({ ...current, hours }))}
            ariaLabel={t('estimate.hours')}
            error={isAmountInvalid(draft.hours)}
          />
        </TableCell>
        <TableCell>
          <CellField
            value={draft.priceHr}
            onChange={(priceHr) => setDraft((current) => ({ ...current, priceHr }))}
            ariaLabel={t('estimate.priceHr')}
            error={isAmountInvalid(draft.priceHr)}
          />
        </TableCell>
        <TableCell>
          <CellField
            value={draft.total}
            onChange={(total) => setDraft((current) => ({ ...current, total }))}
            ariaLabel={t('estimate.total')}
            error={isAmountInvalid(draft.total)}
          />
        </TableCell>
        <TableCell>
          <Stack direction="row" spacing={0}>
            <IconButton size="small" onClick={handleSave} disabled={saveDisabled} aria-label={t('workCatalog.save')}>
              <CheckIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={cancelEditing} aria-label={t('common.cancel')}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        </TableCell>
      </TableRow>
    )
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack spacing={1}>
          <Typography variant="h3" component="h2">
            {t('workCatalog.title')}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('workCatalog.description')}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <TextField
            size="small"
            value={search}
            onChange={(event) => handleSearchChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape' && search) {
                event.stopPropagation()
                clearSearch()
              }
            }}
            placeholder={t('workCatalog.searchPlaceholder')}
            inputRef={searchRef}
            sx={{ width: SEARCH_WIDTH }}
            slotProps={{
              htmlInput: { 'aria-label': t('workCatalog.searchPlaceholder') },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: search ? (
                  <InputAdornment position="end">
                    <IconButton size="small" edge="end" onClick={clearSearch} aria-label={t('workCatalog.clearSearch')}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : undefined,
              },
            }}
          />
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => startAdding()} disabled={editingId === NEW_ROW}>
            {t('workCatalog.newItem')}
          </Button>
        </Stack>
      </Stack>

      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '12px' }}>
        {/* Fixed layout + equal row heights keep every cell where it is when a row switches to edit mode. */}
        <Table size="small" sx={{ tableLayout: 'fixed' }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: COLUMN_WIDTHS.name }}>{t('estimate.name')}</TableCell>
              <TableCell sx={{ width: COLUMN_WIDTHS.amount }}>{t('estimate.hours')}</TableCell>
              <TableCell sx={{ width: COLUMN_WIDTHS.amount }}>{t('estimate.priceHr')}</TableCell>
              <TableCell sx={{ width: COLUMN_WIDTHS.amount }}>{t('estimate.total')}</TableCell>
              <TableCell sx={{ width: COLUMN_WIDTHS.actions }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {editingId === NEW_ROW && renderEditRow(NEW_ROW, true)}

            {totalCount === 0 && !debouncedSearch && editingId !== NEW_ROW && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', py: 2, textAlign: 'center' }}>
                    {t('workCatalog.empty')}
                  </Typography>
                </TableCell>
              </TableRow>
            )}

            {totalCount === 0 && debouncedSearch && !isPlaceholderData && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Stack spacing={2} sx={{ alignItems: 'center', py: 3 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {t('workCatalog.noResults')}
                    </Typography>
                    {editingId !== NEW_ROW && (
                      <Button variant="outlined" startIcon={<AddIcon />} onClick={() => startAdding(debouncedSearch)}>
                        {t('workCatalog.createWithName')}
                      </Button>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            )}

            {pageItems.map((item) =>
              editingId === item.id ? (
                renderEditRow(item.id, true)
              ) : (
                <TableRow key={item.id} hover sx={ROW_SX}>
                  <TableCell sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.name}>
                    <HighlightedText text={item.name} query={debouncedSearch} />
                  </TableCell>
                  <TableCell>{formatAmount(item.hours)}</TableCell>
                  <TableCell>{formatAmount(item.priceHr)}</TableCell>
                  <TableCell>{formatAmount(item.total)}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0}>
                      <IconButton size="small" onClick={() => startEditing(item)} aria-label={t('workCatalog.edit')}>
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(item)}
                        disabled={deleteMutation.isPending}
                        aria-label={t('workCatalog.delete')}
                      >
                        <DeleteOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ),
            )}
          </TableBody>
        </Table>

        {totalCount > PAGE_SIZE_OPTIONS[0] && (
          <TablePagination
            component="div"
            count={totalCount}
            page={currentPage}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={PAGE_SIZE_OPTIONS}
            onPageChange={(_event, newPage) => handlePageChange(newPage)}
            onRowsPerPageChange={(event) => handleRowsPerPageChange(Number(event.target.value))}
            labelRowsPerPage={t('workCatalog.rowsPerPage')}
            labelDisplayedRows={({ from, to, count }) => t('workCatalog.displayedRows', { from, to, total: count })}
          />
        )}
      </TableContainer>
    </Stack>
  )
}
