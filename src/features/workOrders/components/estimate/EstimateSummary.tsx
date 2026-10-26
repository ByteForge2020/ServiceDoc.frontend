import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { toNullableNumber, type EstimateFormState } from '../../workOrderForm'

interface EstimateSummaryProps {
  estimates: EstimateFormState[]
}

// Sums are kept in cents so that adding many rows never shows 0.30000000000000004.
function sumRows(estimates: EstimateFormState[], field: 'total' | 'tax'): number {
  const rows = estimates.flatMap((estimate) => [estimate.root, ...estimate.subItems])
  const cents = rows.reduce((sum, row) => sum + Math.round((toNullableNumber(row[field]) ?? 0) * 100), 0)

  return cents / 100
}

/** The bottom line of the estimate: every row counts, whatever its approved/rejected state. */
export function EstimateSummary({ estimates }: EstimateSummaryProps) {
  const { t, i18n } = useTranslation()
  const formatMoney = (value: number) =>
    `${value.toLocaleString(i18n.language, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${t('estimate.currencyShort')}`

  const total = sumRows(estimates, 'total')
  const tax = sumRows(estimates, 'tax')

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
