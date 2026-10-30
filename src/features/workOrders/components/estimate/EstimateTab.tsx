import { Fragment } from 'react'
import AddIcon from '@mui/icons-material/Add'
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
import { CellField } from '../../../../components/form/CellField'
import { CellNumberStepper } from '../../../../components/form/CellNumberStepper'
import { useConfirm } from '../../../../app/confirm/useConfirm'
import type { DiscountType } from '../../../../app/shop/shopApi'
import { useShopSettingsQuery } from '../../../../app/shop/queries'
import { formatFixedDecimal } from '../../../../utils/decimalInput'
import type { EstimateStatus } from '../../types'
import {
  calculateDiscountAmount,
  createEstimateFormState,
  createEstimateItemRow,
  resolveItemPatch,
  type EstimateFormState,
  type EstimateItemRow,
} from '../../workOrderForm'
import { MAX_QUANTITY } from '../../estimateLimits'
import { CostCell } from './CostCell'
import { DiscountField } from './DiscountField'
import { EstimateSummary } from './EstimateSummary'
import { ExecutorsCell } from './ExecutorsCell'
import { SearchInputDropdown } from './SearchInputDropdown'

interface EstimateTabProps {
  estimates: EstimateFormState[]
  onEstimatesChange: (estimates: EstimateFormState[]) => void
  /** How every row's discount is read, fixed on the order when it is created. */
  discountType: DiscountType
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
const TABLE_MIN_WIDTH = Object.values(COLUMN_WIDTH).reduce((sum, width) => sum + width, 0)

export function EstimateTab({ estimates, onEstimatesChange, discountType }: EstimateTabProps) {
  const { t } = useTranslation()
  const confirm = useConfirm()
  // Set when the shop has "price includes tax" on; new items then get their tax calculated from their total.
  const { data: shopSettings } = useShopSettingsQuery()
  const taxPercent = shopSettings?.priceIncludesTax ? (shopSettings.taxPercent ?? null) : null

  // Removing a row throws away its amounts and executors, so it is confirmed first.
  function confirmRemove(name: string, subItemCount = 0): Promise<boolean> {
    const label = name.trim() || t('estimate.unnamedItem')

    return confirm({
      title: t('estimate.removeTitle'),
      message:
        subItemCount > 0
          ? t('estimate.removeConfirmWithSubItems', { name: label, count: subItemCount })
          : t('estimate.removeConfirm', { name: label }),
      confirmLabel: t('estimate.removeConfirmLabel'),
      destructive: true,
    })
  }

  function updateEstimate(key: string, patch: Partial<EstimateFormState>) {
    onEstimatesChange(estimates.map((estimate) => (estimate.key === key ? { ...estimate, ...patch } : estimate)))
  }

  function updateSubItem(estimateKey: string, subKey: string, patch: Partial<EstimateItemRow>) {
    const estimate = estimates.find((item) => item.key === estimateKey)
    if (!estimate) {
      return
    }

    updateEstimate(estimateKey, {
      subItems: estimate.subItems.map((row) => (row.key === subKey ? { ...row, ...patch } : row)),
    })
  }

  return (
    <Stack spacing={3}>
      {estimates.length > 0 && (
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
                <TableCell sx={{ width: COLUMN_WIDTH.total, ...NUMERIC_HEAD_SX }}>{t('estimate.total')}</TableCell>
                <TableCell sx={{ width: COLUMN_WIDTH.actions }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {estimates.map((estimate) => (
                <Fragment key={estimate.key}>
                  <EstimateItemRowView
                    row={estimate.root}
                    discountType={discountType}
                    status={estimate.status}
                    onStatusChange={(status) => updateEstimate(estimate.key, { status })}
                    onChange={(patch) => updateEstimate(estimate.key, { root: { ...estimate.root, ...patch } })}
                    onRemove={async () => {
                      if (await confirmRemove(estimate.root.name, estimate.subItems.length)) {
                        onEstimatesChange(estimates.filter((item) => item.key !== estimate.key))
                      }
                    }}
                    onAddSubItem={() =>
                      updateEstimate(estimate.key, {
                        subItems: [...estimate.subItems, createEstimateItemRow(true, '', undefined, taxPercent)],
                      })
                    }
                  />
                  {estimate.subItems.map((sub) => (
                    <EstimateItemRowView
                      key={sub.key}
                      row={sub}
                      discountType={discountType}
                      onChange={(patch) => updateSubItem(estimate.key, sub.key, patch)}
                      onRemove={async () => {
                        // A sub-item nobody has named yet has nothing worth a warning.
                        if (sub.name.trim() && !(await confirmRemove(sub.name))) {
                          return
                        }

                        updateEstimate(estimate.key, {
                          subItems: estimate.subItems.filter((row) => row.key !== sub.key),
                        })
                      }}
                    />
                  ))}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 3 }}>
        <Box>
          <SearchInputDropdown
            excludedNames={estimates.map((estimate) => estimate.root.name)}
            onSelect={(item) => onEstimatesChange([...estimates, createEstimateFormState(item.name, item, taxPercent)])}
          />
        </Box>
        {estimates.length > 0 && <EstimateSummary estimates={estimates} />}
      </Stack>
    </Stack>
  )
}

interface EstimateItemRowViewProps {
  row: EstimateItemRow
  discountType: DiscountType
  onChange: (patch: Partial<EstimateItemRow>) => void
  onRemove: () => void | Promise<void>
  onAddSubItem?: () => void
  status?: EstimateStatus
  onStatusChange?: (status: EstimateStatus) => void
}

function EstimateItemRowView({
  row,
  discountType,
  onChange,
  onRemove,
  onAddSubItem,
  status,
  onStatusChange,
}: EstimateItemRowViewProps) {
  const { t, i18n } = useTranslation()
  const formattedTax = formatFixedDecimal(row.tax, i18n.language, 2)
  const taxText = formattedTax !== null ? `${t('estimate.tax')} ${formattedTax} ${t('estimate.currencyShort')}` : null

  // Routes every amount edit through the shared rule that keeps price, quantity, discount and total in step.
  function change(patch: Partial<EstimateItemRow>) {
    onChange(resolveItemPatch(row, patch, discountType))
  }

  return (
    <TableRow sx={row.subItem ? { backgroundColor: 'background.default' } : undefined}>
      <TableCell>
        {/* Status belongs to the estimate, so only its root row shows it. */}
        {status && onStatusChange && (
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
        )}
      </TableCell>
      <TableCell sx={row.subItem ? { pl: 4 } : undefined}>
        <TextField
          size="small"
          variant="outlined"
          fullWidth
          value={row.name}
          onChange={(event) => onChange({ name: event.target.value })}
          placeholder={row.subItem ? t('estimate.subItemNamePlaceholder') : undefined}
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
      {/* Always calculated: price x quantity minus the discount. Its tax, at the row's own rate, is the small line in the corner. */}
      <TableCell>
        <Box sx={{ position: 'relative' }}>
          <CellField
            value={row.total}
            onChange={() => undefined}
            ariaLabel={t('estimate.total')}
            displayDecimals={2}
            unit={t('estimate.currencyShort')}
            readOnly
          />
          {taxText && (
            // In the left corner: the total is right-aligned, so that side is free.
            <Typography
              variant="caption"
              sx={{
                position: 'absolute',
                left: '8px',
                bottom: '4px',
                lineHeight: 1,
                color: 'text.secondary',
                pointerEvents: 'none',
              }}
            >
              {taxText}
            </Typography>
          )}
        </Box>
      </TableCell>      <TableCell>
        <Stack direction="row" spacing={0}>
          {onAddSubItem && (
            <IconButton size="small" onClick={onAddSubItem} aria-label={t('estimate.addSubItem')}>
              <AddIcon fontSize="small" />
            </IconButton>
          )}
          <IconButton size="small" onClick={onRemove} aria-label={t('estimate.removeAria')}>
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Stack>
      </TableCell>
    </TableRow>
  )
}
