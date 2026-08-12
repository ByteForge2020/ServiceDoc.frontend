import { useId } from 'react'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import type { DateTime } from 'luxon'

export interface AppDatePickerProps {
  label?: string
  value: DateTime | null
  onChange: (value: DateTime | null) => void
  required?: boolean
  disabled?: boolean
  id?: string
}

export function AppDatePicker({ label, value, onChange, required, disabled, id }: AppDatePickerProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <Stack spacing={1} sx={{ flex: 1, minWidth: 0 }}>
      {label && (
        <Typography variant="body2" component="label" htmlFor={inputId} sx={{ fontWeight: 600, color: 'text.primary' }}>
          {label}
          {required && (
            <Box component="span" sx={{ color: 'error.main' }}>
              {' *'}
            </Box>
          )}
        </Typography>
      )}
      <DatePicker
        value={value}
        onChange={onChange}
        disabled={disabled}
        format="dd/MM/yy"
        slotProps={{
          textField: {
            id: inputId,
            variant: 'outlined',
            fullWidth: true,
            required,
          },
        }}
      />
    </Stack>
  )
}
