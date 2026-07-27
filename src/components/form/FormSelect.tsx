import { useId } from 'react'
import Box from '@mui/material/Box'
import MenuItem from '@mui/material/MenuItem'
import Select, { type SelectChangeEvent } from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

export interface FormSelectOption<T extends string | number> {
  value: T
  label: string
}

export interface FormSelectProps<T extends string | number> {
  label: string
  placeholder?: string
  value: T | ''
  onChange: (value: T | '') => void
  options: FormSelectOption<T>[]
  disabled?: boolean
  required?: boolean
  id?: string
}

export function FormSelect<T extends string | number>({
  label,
  placeholder,
  value,
  onChange,
  options,
  disabled,
  required,
  id,
}: FormSelectProps<T>) {
  const generatedId = useId()
  const selectId = id ?? generatedId

  function handleChange(event: SelectChangeEvent<T | ''>) {
    onChange(event.target.value as T | '')
  }

  return (
    <Stack spacing={1} sx={{ flex: 1, minWidth: 0 }}>
      <Typography variant="body2" component="label" htmlFor={selectId} sx={{ fontWeight: 600, color: 'text.primary' }}>
        {label}
        {required && (
          <Box component="span" sx={{ color: 'error.main' }}>
            {' *'}
          </Box>
        )}
      </Typography>
      <Select<T | ''>
        id={selectId}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        displayEmpty
        fullWidth
        renderValue={(selected) => {
          if (selected === '') {
            return (
              <Box component="span" sx={{ color: 'text.disabled' }}>
                {placeholder}
              </Box>
            )
          }
          return options.find((option) => option.value === selected)?.label ?? ''
        }}
      >
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </Stack>
  )
}
