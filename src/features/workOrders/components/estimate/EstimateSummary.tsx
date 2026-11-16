import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { calculateTax, toNullableNumber, type EstimateItemRow } from '../../workOrderForm'

interface EstimateSummaryProps {
  items: EstimateItemRow[]
  /** The order's tax rate in percent, null for none. */
  taxPercent: number | null
}

// Sums are kept in cents so that adding many rows never shows 0.30000000000000004. A row's tax is worked out from its
// total at the order's rate, rounded per row like the server does.
function sumRows(rows: EstimateItemRow[], amountOf: (total: string) => string): number {
  const cents = rows.reduce((sum, row) => sum + Math.round((toNullableNumber(amountOf(row.total)) ?? 0) * 100), 0)

  return cents / 100
}

/** The bottom line of the estimate: every row counts, whatever its approved/rejected state. */
export function EstimateSummary({ items, taxPercent }: EstimateSummaryProps) {
  const { t, i18n } = useTranslation()
  const formatMoney = (value: number) =>
    `${value.toLocaleString(i18n.language, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${t('estimate.currencyShort')}`

  const total = sumRows(items, (value) => value)
  const tax = sumRows(items, (value) => calculateTax(value, taxPercent))

  return (
    <Stack spacing={0.75} sx={{ minWidth: { sm: 280 }, width: { xs: '100%', sm: 'auto' }, px: 1 }}>
      {tax > 0 && (
        <Stack direction="row" spacing={3} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="body2" color="text.secondary">
            {t('estimate.summaryTax')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
            {formatMoney(tax)}
          </Typography>
        </Stack>
      )}

      <Stack direction="row" spacing={3} sx={{ alignItems: 'baseline', justifyContent: 'space-between' }}>
        <Typography variant="body1" sx={{ fontWeight: 600 }}>
          {t('estimate.summaryTotal')}
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
          {formatMoney(total)}
        </Typography>
      </Stack>
    </Stack>
  )
}
