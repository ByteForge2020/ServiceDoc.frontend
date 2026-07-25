import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation()

  return (
    <Paper variant="outlined" sx={{ p: 4, borderRadius: '12px' }}>
      <Stack spacing={3}>
        <Typography variant="h4" component="h2">
          {t('orderInformation.title')}
        </Typography>

        <TextField
          label={t('orderInformation.orderNumber')}
          value={orderNumber}
          onChange={(event) => onOrderNumberChange(event.target.value)}
          error={orderNumberError}
          helperText={orderNumberError ? t('orderInformation.orderNumberInUse') : undefined}
          required
          fullWidth
        />

        <TextField
          label={t('orderInformation.notes')}
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
