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
import { useTranslation } from 'react-i18next'
import { CellField } from '../../../../components/form/CellField'
import { CellNumberStepper } from '../../../../components/form/CellNumberStepper'
import type { DiscountType } from '../../../../app/shop/shopApi'
import { useShopSettingsQuery } from '../../../../app/shop/queries'
import { CellSelect } from '../../../../components/form/CellSelect'
import type { EstimateStatus } from '../../types'
import {
  calculateDiscountAmount,
  createEstimateFormState,
  createEstimateItemRow,
  resolveItemPatch,
  type EstimateFormState,
  type EstimateItemRow,
} from '../../workOrderForm'
import { MAX_HOURS, MAX_PRICE, MAX_QUANTITY } from '../../estimateLimits'
import { useEstimateTypeOptions } from '../../useEstimateTypeOptions'
import { DiscountField } from './DiscountField'
import { EstimateSummary } from './EstimateSummary'
import { SearchInputDropdown } from './SearchInputDropdown'

interface EstimateTabProps {
  estimates: EstimateFormState[]
  onEstimatesChange: (estimates: EstimateFormState[]) => void
  /** How every row's discount is read, fixed on the order when it is created. */
  discountType: DiscountType
}

// Column widths in px. Discount holds "-100%" plus its money equivalent, and tax/total can reach hundreds of billions.
const COLUMN_WIDTH = {
  name: 220,
  status: 88,
  type: 140,
  hours: 100,
  priceHr: 130,
  price: 130,
  quantity: 96,
  discount: 200,
  tax: 170,
  total: 190,
  actions: 90,
}
const TABLE_MIN_WIDTH = Object.values(COLUMN_WIDTH).reduce((sum, width) => sum + width, 0)

export function EstimateTab({ estimates, onEstimatesChange, discountType }: EstimateTabProps) {
  const { t } = useTranslation()
  // Set when the shop has "price includes tax" on; new items then get their tax calculated from their total.
  const { data: shopSettings } = useShopSettingsQuery()
  const taxPercent = shopSettings?.priceIncludesTax ? (shopSettings.taxPercent ?? null) : null

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
                <TableCell sx={{ width: COLUMN_WIDTH.name }}>{t('estimate.name')}</TableCell>
                <TableCell sx={{ width: COLUMN_WIDTH.status }}>{t('estimate.status')}</TableCell>
                <TableCell sx={{ width: COLUMN_WIDTH.type }}>{t('estimate.type')}</TableCell>
                <TableCell sx={{ width: COLUMN_WIDTH.hours }}>{t('estimate.hours')}</TableCell>
                <TableCell sx={{ width: COLUMN_WIDTH.priceHr }}>{t('estimate.priceHr')}</TableCell>
                <TableCell sx={{ width: COLUMN_WIDTH.price }}>{t('estimate.price')}</TableCell>
                <TableCell sx={{ width: COLUMN_WIDTH.quantity }}>{t('estimate.quantity')}</TableCell>
                <TableCell sx={{ width: COLUMN_WIDTH.discount }}>{t('estimate.discount')}</TableCell>
                <TableCell sx={{ width: COLUMN_WIDTH.tax }}>{t('estimate.tax')}</TableCell>
                <TableCell sx={{ width: COLUMN_WIDTH.total }}>{t('estimate.total')}</TableCell>
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
                    onRemove={() => onEstimatesChange(estimates.filter((item) => item.key !== estimate.key))}
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
                      onRemove={() =>
                        updateEstimate(estimate.key, {
                          subItems: estimate.subItems.filter((row) => row.key !== sub.key),
                        })
                      }
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
  const { t } = useTranslation()
  const typeOptions = useEstimateTypeOptions()

  // Routes every amount edit through the shared rule that keeps price, quantity, discount and total in step.
  function change(patch: Partial<EstimateItemRow>) {
    onChange(resolveItemPatch(row, patch, discountType))
  }

  return (
    <TableRow sx={row.subItem ? { backgroundColor: 'background.default' } : undefined}>
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
      <TableCell>
        <CellSelect
          value={row.type}
          onChange={(type) => change({ type })}
          options={typeOptions}
          ariaLabel={t('estimate.type')}
        />
      </TableCell>
      {/* Fixed: the total is typed in and hours/rate are kept but locked. Hourly: the total is hours x rate. */}
      <TableCell>
        <CellField
          value={row.hours}
          onChange={(value) => change({ hours: value })}
          ariaLabel={t('estimate.hours')}
          maxDecimals={2}
          max={MAX_HOURS}
          readOnly={row.type === 'Fixed'}
          struckThrough={row.type === 'Fixed'}
        />
      </TableCell>
      <TableCell>
        <CellField
          value={row.priceHr}
          onChange={(value) => change({ priceHr: value })}
          ariaLabel={t('estimate.priceHr')}
          maxDecimals={2}
          max={MAX_PRICE}
          unit={t('estimate.currencyShort')}
          readOnly={row.type === 'Fixed'}
          struckThrough={row.type === 'Fixed'}
        />
      </TableCell>
      {/* Fixed: the price is typed in. Hourly: it is hours x rate, so it is shown but locked. */}
      <TableCell>
        <CellField
          value={row.price}
          onChange={(value) => change({ price: value })}
          ariaLabel={t('estimate.price')}
          maxDecimals={2}
          max={MAX_PRICE}
          unit={t('estimate.currencyShort')}
          readOnly={row.type === 'Hourly'}
        />
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
      {/* The tax is a snapshot taken when the item was added, so it can never be edited here. */}
      <TableCell>
        <CellField
          value={row.tax}
          onChange={() => undefined}
          ariaLabel={t('estimate.tax')}
          unit={t('estimate.currencyShort')}
          readOnly
        />
      </TableCell>
      {/* Always calculated: price x quantity minus the discount. */}
      <TableCell>
        <CellField
          value={row.total}
          onChange={() => undefined}
          ariaLabel={t('estimate.total')}
          unit={t('estimate.currencyShort')}
          readOnly
        />
      </TableCell>
      <TableCell>
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
