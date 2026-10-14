import TextField from '@mui/material/TextField'

interface CellFieldProps {
  value: string
  onChange: (value: string) => void
  ariaLabel: string
  numeric?: boolean
  error?: boolean
  placeholder?: string
  autoFocus?: boolean
  readOnly?: boolean
  /** Greyed out and not focusable, for a value the user can never change (e.g. a calculated snapshot). */
  disabled?: boolean
}

/** Compact, label-less input for editable table cells. Numeric by default (decimal keypad on touch devices). */
export function CellField({
  value,
  onChange,
  ariaLabel,
  numeric = true,
  error = false,
  placeholder,
  autoFocus = false,
  readOnly = false,
  disabled = false,
}: CellFieldProps) {
  return (
    <TextField
      size="small"
      variant="outlined"
      fullWidth
      value={value}
      onChange={(event) => onChange(event.target.value)}
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
