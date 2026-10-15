import TextField from '@mui/material/TextField'
import { sanitizeDecimalInput } from '../../utils/decimalInput'

interface CellFieldProps {
  value: string
  onChange: (value: string) => void
  ariaLabel: string
  numeric?: boolean
  /**
   * Makes the field a non-negative decimal with at most this many digits after the separator: text, a minus sign and
   * extra digits are dropped as the user types or pastes. Without it the field takes whatever is typed.
   */
  maxDecimals?: number
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
  error = false,
  placeholder,
  autoFocus = false,
  readOnly = false,
  disabled = false,
  onBlur,
}: CellFieldProps) {
  return (
    <TextField
      size="small"
      variant="outlined"
      fullWidth
      value={value}
      onChange={(event) =>
        onChange(maxDecimals === undefined ? event.target.value : sanitizeDecimalInput(event.target.value, maxDecimals))
      }
      onBlur={onBlur}
      error={error}
      placeholder={placeholder}
      autoFocus={autoFocus}
      disabled={disabled}
      // A read-only value (e.g. a calculated total) is shown but looks different from an editable one.
      sx={readOnly ? { '& .MuiInputBase-root': { bgcolor: 'action.hover' } } : undefined}
      slotProps={{
        htmlInput: { 'aria-label': ariaLabel, inputMode: numeric ? 'decimal' : 'text', readOnly },
      }}
    />
  )
}
