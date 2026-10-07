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
      slotProps={{
        htmlInput: { 'aria-label': ariaLabel, inputMode: numeric ? 'decimal' : 'text', readOnly },
      }}
    />
  )
}
