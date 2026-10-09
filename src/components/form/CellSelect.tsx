import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'

export interface CellSelectOption<T extends string> {
  value: T
  label: string
}

interface CellSelectProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: CellSelectOption<T>[]
  ariaLabel: string
}

/** Compact, label-less dropdown for editable table cells; the select counterpart of CellField. */
export function CellSelect<T extends string>({ value, onChange, options, ariaLabel }: CellSelectProps<T>) {
  return (
    <Select<T>
      size="small"
      fullWidth
      value={value}
      onChange={(event) => onChange(event.target.value as T)}
      inputProps={{ 'aria-label': ariaLabel }}
    >
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </Select>
  )
}
