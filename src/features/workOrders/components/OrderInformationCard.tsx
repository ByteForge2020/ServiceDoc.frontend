import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { FormTextField } from '../../../components/form/FormTextField'

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
    <Stack spacing={3}>
      <Typography variant="h4" component="h2">
        {t('orderInformation.title')}
      </Typography>

      <FormTextField
        label={t('orderInformation.orderNumber')}
        placeholder={t('orderInformation.orderNumberPlaceholder')}
        value={orderNumber}
        onChange={(event) => onOrderNumberChange(event.target.value)}
        error={orderNumberError}
        helperText={orderNumberError ? t('orderInformation.orderNumberInUse') : undefined}
        required
      />

      <FormTextField
        label={t('orderInformation.notes')}
        placeholder={t('orderInformation.notesPlaceholder')}
        value={notes}
        onChange={(event) => onNotesChange(event.target.value)}
        multiline
        minRows={3}
      />
    </Stack>
  )
}
