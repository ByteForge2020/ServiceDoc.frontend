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
import { CellSelect } from '../../../components/form/CellSelect'
import { HighlightedText } from '../../../components/HighlightedText'
import {
  useCreateEstimateMasterListItemMutation,
  useDeleteEstimateMasterListItemMutation,
  useEstimateMasterListPageQuery,
  useUpdateEstimateMasterListItemMutation,
} from '../../workOrders/estimateMasterListQueries'
import { useDebouncedValue } from '../../workOrders/components/useDebouncedValue'
import { TaxSettings } from './TaxSettings'
import { useEstimateTypeLabel, useEstimateTypeOptions } from '../../workOrders/useEstimateTypeOptions'
import { resolveAmountPatch, toNullableNumber, type EstimateAmountFields } from '../../workOrders/workOrderForm'

const MAX_NAME_LENGTH = 200
const SEARCH_DEBOUNCE_MS = 250
const SEARCH_WIDTH = 300
const PAGE_SIZE_OPTIONS = [10, 25, 50]

const COLUMN_WIDTHS = { name: '31%', type: '15%', amount: '13%', actions: '15%' }
const COLUMN_COUNT = 6

// Tall enough for the edit row's inputs, so view and edit rows have the same height.
const ROW_SX = { height: (theme: Theme) => theme.spacing(6) }

// Inputs are taller than plain text, so the edit row drops its vertical cell padding and lets ROW_SX set the height.
const EDIT_ROW_SX = { ...ROW_SX, '& > .MuiTableCell-root': { py: 0 } }

const NEW_ROW = 'new'

interface Draft extends EstimateAmountFields {
  name: string
}

// New work items are Fixed unless the user picks Hourly.
const EMPTY_DRAFT: Draft = { name: '', type: 'Fixed', hours: '', priceHr: '', price: '' }

function toDraft(item: EstimateMasterListItem): Draft {
  return {
    name: item.name,
    type: item.type,
    hours: item.hours != null ? String(item.hours) : '',
    priceHr: item.priceHr != null ? String(item.priceHr) : '',
    price: item.price != null ? String(item.price) : '',
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

// Matches the height of the inputs in the edit row, so a locked value looks like a locked input.
const LOCKED_VALUE_HEIGHT = '36px'

/**
 * An amount in a read-only row. When the item's type does not use it (hours and rate for Fixed, the price for Hourly)
 * the value sits in a greyed-out box like the locked inputs of the edit row, so it reads as unavailable.
 */
function AmountCell({ value, locked }: { value: number | null; locked: boolean }) {
  if (!locked) {
    return <TableCell>{formatAmount(value)}</TableCell>
  }

  return (
    <TableCell sx={{ py: 0 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          height: LOCKED_VALUE_HEIGHT,
          px: '12px',
          borderRadius: '8px',
          border: 1,
          borderColor: 'divider',
          bgcolor: 'action.hover',
          color: 'text.disabled',
        }}
      >
        {formatAmount(value)}
      </Box>
    </TableCell>
  )
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
  const typeOptions = useEstimateTypeOptions()
  const typeLabel = useEstimateTypeLabel()
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
    // An Hourly price is calculated from hours and rate, so only a typed-in (Fixed) price can be invalid.
    (draft.type === 'Fixed' && isAmountInvalid(draft.price)) ||
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
      type: draft.type,
      hours: toNullableNumber(draft.hours),
      priceHr: toNullableNumber(draft.priceHr),
      price: toNullableNumber(draft.price),
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

  // Type, hours, rate and price edits go through the shared rule that keeps an Hourly price = hours x rate.
  function changeAmounts(patch: Partial<EstimateAmountFields>) {
    setDraft((current) => ({ ...current, ...resolveAmountPatch(current, patch) }))
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
          <CellSelect
            value={draft.type}
            onChange={(type) => changeAmounts({ type })}
            options={typeOptions}
            ariaLabel={t('estimate.type')}
          />
        </TableCell>
        {/* Fixed: the price is typed in and hours/rate are kept but locked. Hourly: the price is hours x rate. */}
        <TableCell>
          <CellField
            value={draft.hours}
            onChange={(hours) => changeAmounts({ hours })}
            ariaLabel={t('estimate.hours')}
            error={isAmountInvalid(draft.hours)}
            readOnly={draft.type === 'Fixed'}
          />
        </TableCell>
        <TableCell>
          <CellField
            value={draft.priceHr}
            onChange={(priceHr) => changeAmounts({ priceHr })}
            ariaLabel={t('estimate.priceHr')}
            error={isAmountInvalid(draft.priceHr)}
            readOnly={draft.type === 'Fixed'}
          />
        </TableCell>
        <TableCell>
          <CellField
            value={draft.price}
            onChange={(price) => changeAmounts({ price })}
            ariaLabel={t('estimate.price')}
            error={draft.type === 'Fixed' && isAmountInvalid(draft.price)}
            readOnly={draft.type === 'Hourly'}
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

      {/* Shop-wide setting, not a per-row field: the tax it produces is stored on work order items, not here. */}
      <TaxSettings />

      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '12px' }}>
        {/* Fixed layout + equal row heights keep every cell where it is when a row switches to edit mode. */}
        <Table size="small" sx={{ tableLayout: 'fixed' }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: COLUMN_WIDTHS.name }}>{t('estimate.name')}</TableCell>
              <TableCell sx={{ width: COLUMN_WIDTHS.type }}>{t('estimate.type')}</TableCell>
              <TableCell sx={{ width: COLUMN_WIDTHS.amount }}>{t('estimate.hours')}</TableCell>
              <TableCell sx={{ width: COLUMN_WIDTHS.amount }}>{t('estimate.priceHr')}</TableCell>
              <TableCell sx={{ width: COLUMN_WIDTHS.amount }}>{t('estimate.price')}</TableCell>
              <TableCell sx={{ width: COLUMN_WIDTHS.actions }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {editingId === NEW_ROW && renderEditRow(NEW_ROW, true)}

            {totalCount === 0 && !debouncedSearch && editingId !== NEW_ROW && (
              <TableRow>
                <TableCell colSpan={COLUMN_COUNT}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', py: 2, textAlign: 'center' }}>
                    {t('workCatalog.empty')}
                  </Typography>
                </TableCell>
              </TableRow>
            )}

            {totalCount === 0 && debouncedSearch && !isPlaceholderData && (
              <TableRow>
                <TableCell colSpan={COLUMN_COUNT}>
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
                  <TableCell>{typeLabel(item.type)}</TableCell>
                  <AmountCell value={item.hours} locked={item.type === 'Fixed'} />
                  <AmountCell value={item.priceHr} locked={item.type === 'Fixed'} />
                  <AmountCell value={item.price} locked={item.type === 'Hourly'} />
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
