import { useState } from 'react'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import { useTranslation } from 'react-i18next'
import { formatFixedDecimal, sanitizeDecimalInput } from '../../utils/decimalInput'

interface CellFieldProps {
  value: string
  onChange: (value: string) => void
  ariaLabel: string
  /** A number: the decimal keypad on touch devices, and the value is right-aligned. */
  numeric?: boolean
  /**
   * Makes the field a non-negative decimal with at most this many digits after the separator: text, a minus sign and
   * extra digits are dropped as the user types or pastes. Without it the field takes whatever is typed.
   */
  maxDecimals?: number
  /**
   * Shows the number the way the locale writes it, with this many decimals and thousands separators ("10 020,00"),
   * while the field is not being edited. Focusing it shows what was typed, so editing is never fought by the format.
   * A read-only field always shows the formatted number.
   */
  displayDecimals?: number
  /** A larger number typed or pasted is replaced by this one. Text is left alone (and still not a number). */
  max?: number
  /** A unit shown right after the value (e.g. a currency sign) while the field has one; not part of the value. */
  unit?: string
  error?: boolean
  placeholder?: string
  autoFocus?: boolean
  readOnly?: boolean
  /** Greyed out and not focusable, for a value the user can never change (e.g. a calculated snapshot). */
  disabled?: boolean
  onBlur?: () => void
}

/** Compact, label-less input for editable table cells. Numeric by default (decimal keypad on touch devices). */
export function CellField({
  value,
  onChange,
  ariaLabel,
  numeric = true,
  maxDecimals,
  displayDecimals,
  max,
  unit,
  error = false,
  placeholder,
  autoFocus = false,
  readOnly = false,
  disabled = false,
  onBlur,
}: CellFieldProps) {
  const { i18n } = useTranslation()
  const [focused, setFocused] = useState(false)

  const formatted =
    displayDecimals !== undefined && (!focused || readOnly || disabled)
      ? formatFixedDecimal(value, i18n.language, displayDecimals)
      : null
  const shown = formatted ?? value
  const showUnit = unit !== undefined && shown !== ''

  return (
    <TextField
      size="small"
      variant="outlined"
      fullWidth
      value={shown}
      onChange={(event) => {
        const next = maxDecimals === undefined ? event.target.value : sanitizeDecimalInput(event.target.value, maxDecimals)
        onChange(max !== undefined && Number(next.replace(',', '.')) > max ? String(max) : next)
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false)
        onBlur?.()
      }}
      error={error}
      placeholder={placeholder}
      autoFocus={autoFocus}
      disabled={disabled}
      sx={{
        '& .MuiInputBase-root': {
          // A read-only value (e.g. a calculated total) is shown but looks different from an editable one.
          ...(readOnly && { bgcolor: 'action.hover' }),
          // Numbers line up on their right edge, the unit hugging the last digit.
          ...(numeric && { justifyContent: 'flex-end' }),
        },
        ...(numeric && { '& .MuiInputBase-input': { textAlign: 'right' } }),
      }}
      slotProps={{
        htmlInput: {
          'aria-label': ariaLabel,
          inputMode: numeric ? 'decimal' : 'text',
          readOnly,
          // Sized to the value so the unit hugs it: "50 р." rather than "50        р.".
          style: showUnit ? { width: `${shown.length}ch`, paddingRight: 0 } : undefined,
        },
        input: {
          endAdornment: showUnit ? (
            <InputAdornment position="end" disablePointerEvents sx={{ ml: 1 }}>
              {unit}
            </InputAdornment>
          ) : undefined,
        },
      }}
    />
  )
}
