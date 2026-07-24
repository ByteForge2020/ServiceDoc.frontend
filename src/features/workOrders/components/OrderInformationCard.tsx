import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

interface OrderInformationCardProps {
  orderNumber: string
  onOrderNumberChange: (value: string) => void
  orderNumberError: boolean
  notes: string
  onNotesChange: (value: string) => void
}

export function OrderInformationCard({
  orderNumber,
  onOrderNumberChange,
  orderNumberError,
  notes,
  onNotesChange,
}: OrderInformationCardProps) {
  return (
    <Paper variant="outlined" sx={{ p: 4, borderRadius: '12px' }}>
      <Stack spacing={3}>
        <Typography variant="h4" component="h2">
          Order Information
        </Typography>

        <TextField
          label="Order number"
          value={orderNumber}
          onChange={(event) => onOrderNumberChange(event.target.value)}
          error={orderNumberError}
          helperText={orderNumberError ? 'This order number is already in use.' : undefined}
          required
          fullWidth
        />

        <TextField
          label="Notes"
          value={notes}
          onChange={(event) => onNotesChange(event.target.value)}
          multiline
          minRows={3}
          fullWidth
        />
      </Stack>
    </Paper>
  )
}
