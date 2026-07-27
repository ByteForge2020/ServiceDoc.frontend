import { useId } from 'react'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import TextField, { type TextFieldProps } from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

export type FormTextFieldProps = Omit<TextFieldProps, 'variant' | 'label'> & {
  label: string
}

export function FormTextField({ label, required, id, ...props }: FormTextFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <Stack spacing={1} sx={{ flex: 1, minWidth: 0 }}>
      <Typography variant="body2" component="label" htmlFor={inputId} sx={{ fontWeight: 600, color: 'text.primary' }}>
        {label}
        {required && (
          <Box component="span" sx={{ color: 'error.main' }}>
            {' *'}
          </Box>
        )}
      </Typography>
      <TextField id={inputId} variant="outlined" fullWidth required={required} {...props} />
    </Stack>
  )
}
