import CancelIcon from '@mui/icons-material/Cancel'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import DeleteOutlineIcon from '@mui/icons-material/Delete'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { CellNumberStepper } from '../../../../components/form/CellNumberStepper'
import { useConfirm } from '../../../../app/confirm/useConfirm'
import type { DiscountType } from '../../../../app/shop/shopApi'
import { formatFixedDecimal } from '../../../../utils/decimalInput'
import type { EstimateStatus } from '../../types'
import {
  calculateDiscountAmount,
  calculateTax,
  createEstimateItemRow,
  resolveItemPatch,
  type EstimateItemRow,
} from '../../workOrderForm'
import { MAX_QUANTITY } from '../../estimateLimits'
import { CostCell } from './CostCell'
import { DiscountField } from './DiscountField'
import { EstimateSummary } from './EstimateSummary'
import { ExecutorsCell } from './ExecutorsCell'
import { SearchInputDropdown } from './SearchInputDropdown'

interface EstimateTabProps {
  items: EstimateItemRow[]
  onItemsChange: (items: EstimateItemRow[]) => void
  /** How every row's discount is read, fixed on the order when it is created. */
  discountType: DiscountType
  /** The order's tax rate in percent, null for none: every row's tax is worked out from its total at this rate. */
  taxPercent: number | null
}

// Column widths in px. Cost holds the type toggle plus hours x rate. Discount holds "-100%" plus its money equivalent, and total (with the tax under it) can reach hundreds of billions.
const COLUMN_WIDTH = {
  name: 220,
  executors: 280,
  status: 88,
  cost: 340,
  quantity: 96,
  discount: 150,
  total: 240,
  actions: 90,
}
// A numeric column's title ends where its numbers end: the cell padding plus the input's own padding.
const NUMERIC_HEAD_SX = { textAlign: 'right', pr: '30px' } as const
// Keeps a unit with its number ("1 221,00 р.") when a line would wrap.
const NBSP = String.fromCharCode(160)
const TABLE_MIN_WIDTH = Object.values(COLUMN_WIDTH).reduce((sum, width) => sum + width, 0)

export function EstimateTab({ items, onItemsChange, discountType, taxPercent }: EstimateTabProps) {
  const { t } = useTranslation()
  const confirm = useConfirm()

  // Removing a row throws away its amounts and executors, so it is confirmed first.
  function confirmRemove(name: string): Promise<boolean> {
    const label = name.trim() || t('estimate.unnamedItem')

    return confirm({
      title: t('estimate.removeTitle'),
      message: t('estimate.removeConfirm', { name: label }),
      confirmLabel: t('estimate.removeConfirmLabel'),
      destructive: true,
    })
  }

  function updateItem(key: string, patch: Partial<EstimateItemRow>) {
    onItemsChange(items.map((item) => (item.key === key ? { ...item, ...patch } : item)))
  }

  return (
    // The gap under the table is the card's own bottom padding (32px), so the button sits evenly between them.
    <Stack spacing={4}>
      {items.length > 0 && (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '12px' }}>
          {/* Fixed layout: a column keeps its width whatever its inputs hold; a narrow screen scrolls sideways. */}
          <Table size="small" sx={{ tableLayout: 'fixed', minWidth: TABLE_MIN_WIDTH }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: COLUMN_WIDTH.status }}>{t('estimate.status')}</TableCell>
                <TableCell sx={{ width: COLUMN_WIDTH.name }}>{t('estimate.name')}</TableCell>
                <TableCell sx={{ width: COLUMN_WIDTH.executors }}>{t('estimate.executors.title')}</TableCell>
                <TableCell sx={{ width: COLUMN_WIDTH.cost }}>
                  {/* "Type" over the toggle at the left, "Cost" over the amount at the right (its text ends where the input's does). */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{t('estimate.type')}</span>
                    <Box component="span" sx={{ pr: '14px' }}>
                      {t('estimate.cost')}
                    </Box>
                  </Box>
                </TableCell>
                <TableCell sx={{ width: COLUMN_WIDTH.quantity, ...NUMERIC_HEAD_SX }}>{t('estimate.quantity')}</TableCell>
                <TableCell sx={{ width: COLUMN_WIDTH.discount, ...NUMERIC_HEAD_SX }}>{t('estimate.discount')}</TableCell>
                <TableCell sx={{ width: COLUMN_WIDTH.total, textAlign: 'right' }}>{t('estimate.total')}</TableCell>
                <TableCell sx={{ width: COLUMN_WIDTH.actions }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <EstimateItemRowView
                  key={item.key}
                  row={item}
                  discountType={discountType}
                  taxPercent={taxPercent}
                  onStatusChange={(status) => updateItem(item.key, { status })}
                  onChange={(patch) => updateItem(item.key, patch)}
                  onRemove={async () => {
                    if (await confirmRemove(item.name)) {
                      onItemsChange(items.filter((other) => other.key !== item.key))
                    }
                  }}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* The button and the sums share one line, centred on it, so they read as one footer. */}
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 3 }}>
        <Box>
          <SearchInputDropdown
            excludedNames={items.map((item) => item.name)}
            onSelect={(picked) => onItemsChange([...items, createEstimateItemRow(picked.name, picked)])}
          />
        </Box>
        {items.length > 0 && <EstimateSummary items={items} taxPercent={taxPercent} />}
      </Stack>
    </Stack>
  )
}

interface EstimateItemRowViewProps {
  row: EstimateItemRow
  discountType: DiscountType
  taxPercent: number | null
  onChange: (patch: Partial<EstimateItemRow>) => void
  onRemove: () => void | Promise<void>
  onStatusChange: (status: EstimateStatus) => void
}

function EstimateItemRowView({
  row,
  discountType,
  taxPercent,
  onChange,
  onRemove,
  onStatusChange,
}: EstimateItemRowViewProps) {
  const status = row.status
  const { t, i18n } = useTranslation()
  // "1 221,00 р.": one format for every amount in the column; a non-breaking space keeps the unit with its number.
  const formatAmount = (value: string) => {
    const formatted = formatFixedDecimal(value, i18n.language, 2)
    return formatted === null ? null : `${formatted}${NBSP}${t('estimate.currencyShort')}`
  }
  // A row with no amount yet shows zero, in light grey, so the column has a number on every line.
  const filledTotalText = formatAmount(row.total)
  const totalText = filledTotalText ?? formatAmount('0')
  const formattedTax = formatAmount(calculateTax(row.total, taxPercent))
  const taxText = formattedTax !== null ? `${t('estimate.tax')}${NBSP}${formattedTax}` : null

  // Routes every amount edit through the shared rule that keeps price, quantity, discount and total in step.
  function change(patch: Partial<EstimateItemRow>) {
    onChange(resolveItemPatch(row, patch, discountType))
  }

  return (
    <TableRow>
      <TableCell>
        <Stack direction="row" spacing={0}>
          <IconButton
            size="small"
            onClick={() => onStatusChange(status === 'Approved' ? 'Draft' : 'Approved')}
            color={status === 'Approved' ? 'success' : 'default'}
            aria-label={t('estimate.approveAria')}
          >
            <CheckCircleIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => onStatusChange(status === 'Rejected' ? 'Draft' : 'Rejected')}
            color={status === 'Rejected' ? 'error' : 'default'}
            aria-label={t('estimate.rejectAria')}
          >
            <CancelIcon fontSize="small" />
          </IconButton>
        </Stack>
      </TableCell>
      <TableCell>
        <TextField
          size="small"
          variant="outlined"
          fullWidth
          value={row.name}
          onChange={(event) => onChange({ name: event.target.value })}
          slotProps={{ htmlInput: { 'aria-label': t('estimate.name') } }}
        />
      </TableCell>
      <TableCell>
        <ExecutorsCell executors={row.executors} onChange={(executors) => onChange({ executors })} />
      </TableCell>
      <TableCell>
        <CostCell row={row} onChange={change} />
      </TableCell>
      <TableCell>
        <CellNumberStepper
          value={row.quantity}
          onChange={(value) => change({ quantity: value })}
          ariaLabel={t('estimate.quantity')}
          max={MAX_QUANTITY}
        />
      </TableCell>
      <TableCell>
        <DiscountField
          value={row.discount}
          onChange={(value) => change({ discount: value })}
          discountType={discountType}
          moneyEquivalent={calculateDiscountAmount(row, discountType)}
          ariaLabel={t('estimate.discount')}
        />
      </TableCell>
      {/* Always calculated: price x quantity minus the discount. Plain text, not a field: it can't be edited. */}
      <TableCell>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            justifyContent: 'center',
            // The row is as tall as its inputs: the amount and its tax line fit inside that.
            minHeight: 40,
            fontVariantNumeric: 'tabular-nums',
            whiteSpace: 'nowrap',
          }}
        >
          <Typography
            variant="h5"
            component="div"
            aria-label={t('estimate.total')}
            sx={{ fontWeight: 600, lineHeight: '22px', color: filledTotalText === null ? 'text.disabled' : 'text.primary' }}
          >
            {totalText}
          </Typography>
          {/* The row's own tax, under the amount; none (no rate, or the total is empty) leaves no line at all. */}
          {filledTotalText && taxText && (
            <Typography variant="caption" component="div" sx={{ color: 'text.disabled', fontSize: '11px', lineHeight: '14px' }}>
              {taxText}
            </Typography>
          )}
        </Box>
      </TableCell>      <TableCell>
        <Stack direction="row" spacing={0}>
          <IconButton size="small" onClick={onRemove} aria-label={t('estimate.removeAria')}>
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Stack>
      </TableCell>
    </TableRow>
  )
}
