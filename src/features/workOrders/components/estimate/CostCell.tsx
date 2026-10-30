import type { ReactElement } from 'react'
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined'
import ScheduleIcon from '@mui/icons-material/Schedule'
import Box from '@mui/material/Box'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import type { EstimateType } from '../../../../api/estimateMasterListApi'
import { CellField } from '../../../../components/form/CellField'
import { MAX_HOURS, MAX_PRICE } from '../../estimateLimits'
import { useEstimateTypeOptions } from '../../useEstimateTypeOptions'
import type { EstimateItemRow } from '../../workOrderForm'

const TYPE_ICON: Record<EstimateType, ReactElement> = {
  Fixed: <PaymentsOutlinedIcon fontSize="small" />,
  Hourly: <ScheduleIcon fontSize="small" />,
}

// Toggle | hours | "×" | price. A Fixed item skips hours, so its price sits in the same last slot as an Hourly rate
// and the money lines up down the column whatever the types are.
const GRID_COLUMNS = '60px 88px 12px minmax(0, 1fr)'
const PRICE_SLOT = 4

interface CostCellProps {
  row: EstimateItemRow
  /** Applies an edit through the shared rule that keeps price, quantity, discount and total in step. */
  onChange: (patch: Partial<EstimateItemRow>) => void
}

/**
 * What the item costs, in one cell: a type toggle (fixed price / hourly) and only the inputs that type uses. A Fixed item
 * has its price, an Hourly one hours × rate. The other type's values stay in the row, unseen, so switching back loses nothing.
 */
export function CostCell({ row, onChange }: CostCellProps) {
  const { t } = useTranslation()
  const typeOptions = useEstimateTypeOptions()

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: GRID_COLUMNS, columnGap: 0.75, alignItems: 'center' }}>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={row.type}
        onChange={(_event, type: EstimateType | null) => {
          // Clicking the selected button reports null: the type stays as it is.
          if (type) {
            onChange({ type })
          }
        }}
        aria-label={t('estimate.type')}
      >
        {typeOptions.map((option) => (
          <ToggleButton key={option.value} value={option.value} title={option.label} aria-label={option.label} sx={{ flex: 1, height: 40, px: 0 }}>
            {TYPE_ICON[option.value]}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {row.type === 'Hourly' ? (
        <>
          <CellField
            value={row.hours}
            onChange={(value) => onChange({ hours: value })}
            ariaLabel={t('estimate.hours')}
            maxDecimals={2}
            displayDecimals={2}
            max={MAX_HOURS}
            unit={t('estimate.hoursShort')}
          />
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            ×
          </Typography>
          <CellField
            value={row.priceHr}
            onChange={(value) => onChange({ priceHr: value })}
            ariaLabel={t('estimate.priceHr')}
            maxDecimals={2}
            displayDecimals={2}
            max={MAX_PRICE}
            unit={t('estimate.currencyPerHour')}
          />
        </>
      ) : (
        <Box sx={{ gridColumn: PRICE_SLOT }}>
          <CellField
            value={row.price}
            onChange={(value) => onChange({ price: value })}
            ariaLabel={t('estimate.price')}
            maxDecimals={2}
            displayDecimals={2}
            max={MAX_PRICE}
            unit={t('estimate.currencyShort')}
          />
        </Box>
      )}
    </Box>
  )
}
