import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { FormSelect, type FormSelectOption } from '../../../components/form/FormSelect'
import { FormTextField } from '../../../components/form/FormTextField'
import { usePhasesQuery } from '../../settings/phases/queries'

interface OrderInformationCardProps {
  orderNumber: string
  onOrderNumberChange: (value: string) => void
  orderNumberError: boolean
  /** Selected phase id; empty means "not chosen yet", which shows (and saves) the shop's "No phase". */
  phaseId: string
  onPhaseChange: (value: string) => void
  /** The phase saved on the order (edit screen). If it has since been deleted it stays visible but cannot be re-selected. */
  savedPhase?: { id: string; name: string }
  notes: string
  onNotesChange: (value: string) => void
}

export function OrderInformationCard({
  orderNumber,
  onOrderNumberChange,
  orderNumberError,
  phaseId,
  onPhaseChange,
  savedPhase,
  notes,
  onNotesChange,
}: OrderInformationCardProps) {
  const { t } = useTranslation()
  const { data: phases = [] } = usePhasesQuery()

  const noPhaseId = phases.find((phase) => phase.systemType === 'NoPhase')?.id ?? ''
  const phaseOptions: FormSelectOption<string>[] = phases.map((phase) => ({ value: phase.id, label: phase.name }))

  if (savedPhase && !phases.some((phase) => phase.id === savedPhase.id)) {
    phaseOptions.push({ value: savedPhase.id, label: savedPhase.name, disabled: true })
  }

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

      <FormSelect
        label={t('orderInformation.phase')}
        value={phaseId || noPhaseId}
        onChange={(value) => onPhaseChange(value)}
        options={phaseOptions}
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
