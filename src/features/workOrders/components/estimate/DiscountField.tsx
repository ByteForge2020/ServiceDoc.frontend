import Box from '@mui/material/Box'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import type { DiscountType } from '../../../../app/shop/shopApi'
import { sanitizeDecimalInput } from '../../../../utils/decimalInput'

const MAX_DECIMALS = 2
const MAX_PERCENT = 100

interface DiscountFieldProps {
  value: string
  onChange: (value: string) => void
  discountType: DiscountType
  /** What a percent discount takes off in money; shown small in the bottom-right corner. Unused for a fixed discount. */
  moneyEquivalent: number
  ariaLabel: string
}

/**
 * Discount input for an estimate row. It reads as a deduction while typing: "-5%" for a percent discount (with the
 * money equivalent underneath in the corner), "-10 р." for a fixed one. The input itself only holds the number.
 */
export function DiscountField({ value, onChange, discountType, moneyEquivalent, ariaLabel }: DiscountFieldProps) {
  const { t, i18n } = useTranslation()
  const isPercent = discountType === 'Percent'
  const hasValue = value !== ''
  const currency = t('estimate.currencyShort')

  function handleChange(raw: string) {
    const next = sanitizeDecimalInput(raw, MAX_DECIMALS)

    onChange(isPercent && Number(next.replace(',', '.')) > MAX_PERCENT ? String(MAX_PERCENT) : next)
  }

  return (
    <Box sx={{ position: 'relative' }}>
      <TextField
        size="small"
        variant="outlined"
        fullWidth
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        slotProps={{
          htmlInput: {
            'aria-label': ariaLabel,
            inputMode: 'decimal',
            // Sized to the number so the "-" and the unit hug it: "-5%" rather than "-    5    %".
            style: hasValue ? { width: `${value.length}ch`, paddingLeft: 0, paddingRight: 0 } : undefined,
          },
          input: {
            startAdornment: hasValue ? (
              <InputAdornment position="start" disablePointerEvents sx={{ mr: 0 }}>
                -
              </InputAdornment>
            ) : undefined,
            endAdornment: hasValue ? (
              <InputAdornment position="end" disablePointerEvents sx={{ ml: isPercent ? 0 : 1 }}>
                {isPercent ? '%' : currency}
              </InputAdornment>
            ) : undefined,
          },
        }}
      />
      {isPercent && moneyEquivalent > 0 && (
        <Typography
          variant="caption"
          sx={{
            position: 'absolute',
            right: '8px',
            bottom: '4px',
            lineHeight: 1,
            color: 'text.secondary',
            pointerEvents: 'none',
          }}
        >
          {`-${moneyEquivalent.toLocaleString(i18n.language, { maximumFractionDigits: MAX_DECIMALS })} ${currency}`}
        </Typography>
      )}
    </Box>
  )
}
