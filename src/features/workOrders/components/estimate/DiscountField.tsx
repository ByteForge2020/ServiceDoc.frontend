import { useState } from 'react'
import AddIcon from '@mui/icons-material/Add'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import type { DiscountType } from '../../../../app/shop/shopApi'
import { formatFixedDecimal, sanitizeDecimalInput } from '../../../../utils/decimalInput'

const MAX_DECIMALS = 2
const MAX_PERCENT = 100

interface DiscountFieldProps {
  value: string
  onChange: (value: string) => void
  discountType: DiscountType
  /** What a percent discount takes off in money; shown small in the bottom-left corner. Unused for a fixed discount. */
  moneyEquivalent: number
  ariaLabel: string
}

/**
 * Discount input for an estimate row. It reads as a deduction while typing: "-5%" for a percent discount (with the
 * money equivalent underneath in the corner), "-10,00 р." for a fixed one. The input itself only holds the number.
 * Like the other amounts it is right-aligned, and a fixed discount is written as money while it is not being edited.
 */
export function DiscountField({ value, onChange, discountType, moneyEquivalent, ariaLabel }: DiscountFieldProps) {
  const { t, i18n } = useTranslation()
  const [focused, setFocused] = useState(false)
  // Set when the field is opened from the "add" link, so it stays open (and focused) until it is left empty.
  const [opened, setOpened] = useState(false)
  const isPercent = discountType === 'Percent'
  const currency = t('estimate.currencyShort')

  // Most rows have no discount: those show a link instead of an empty box, and a row with one shows the field.
  if (value === '' && !opened && !focused) {
    return (
      <Box sx={{ textAlign: 'right' }}>
        <Button
          size="small"
          startIcon={<AddIcon fontSize="small" />}
          onClick={() => setOpened(true)}
          aria-label={ariaLabel}
          sx={{ textTransform: 'none', whiteSpace: 'nowrap' }}
        >
          {t('estimate.addDiscount')}
        </Button>
      </Box>
    )
  }

  const formatted = !isPercent && !focused ? formatFixedDecimal(value, i18n.language, MAX_DECIMALS) : null
  const shown = formatted ?? value
  const hasValue = shown !== ''

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
        value={shown}
        onChange={(event) => handleChange(event.target.value)}
        autoFocus={opened}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false)
          // Left empty: it goes back to the link.
          setOpened(false)
        }}
        sx={{
          '& .MuiInputBase-root': { justifyContent: 'flex-end' },
          '& .MuiInputBase-input': { textAlign: 'right' },
        }}
        slotProps={{
          htmlInput: {
            'aria-label': ariaLabel,
            inputMode: 'decimal',
            // Sized to the number so the "-" and the unit hug it: "-5%" rather than "-    5    %".
            style: hasValue ? { width: `${shown.length}ch`, paddingLeft: 0, paddingRight: 0 } : undefined,
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
        // In the left corner: the value is right-aligned, so that side is free.
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
          {`-${moneyEquivalent.toLocaleString(i18n.language, { minimumFractionDigits: MAX_DECIMALS, maximumFractionDigits: MAX_DECIMALS })} ${currency}`}
        </Typography>
      )}
    </Box>
  )
}
