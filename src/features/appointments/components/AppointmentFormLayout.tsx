import type { FormEvent } from 'react'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { DateTime } from 'luxon'
import { useTranslation } from 'react-i18next'
import type { AppointmentSettings } from '../../../api/appointmentSettingsApi'
import { FormTextField } from '../../../components/form/FormTextField'
import { CustomerInformationCard, type CustomerFormState } from '../../workOrders/components/CustomerInformationCard'
import { VehicleInformationCard, type VehicleFormState } from '../../workOrders/components/VehicleInformationCard'
import type { AppointmentReason } from '../types'
import { AppointmentReasonsField } from './AppointmentReasonsField'
import { AppointmentTimeSection } from './AppointmentTimeSection'

interface AppointmentFormLayoutProps {
  title: string
  onBack: () => void
  customer: CustomerFormState
  onCustomerChange: (value: CustomerFormState) => void
  vehicle: VehicleFormState
  onVehicleChange: (value: VehicleFormState) => void
  reasons: AppointmentReason[]
  onReasonsChange: (reasons: AppointmentReason[]) => void
  date: DateTime | null
  onDateChange: (value: DateTime | null) => void
  minutes: number | null
  onMinutesChange: (value: number) => void
  settings: AppointmentSettings
  number: string
  onNumberChange: (value: string) => void
  numberError: boolean
  onSubmit: (event: FormEvent) => void
  onCancel: () => void
  saving: boolean
  saveLabel: string
  canSave: boolean
}

export function AppointmentFormLayout({
  title,
  onBack,
  customer,
  onCustomerChange,
  vehicle,
  onVehicleChange,
  reasons,
  onReasonsChange,
  date,
  onDateChange,
  minutes,
  onMinutesChange,
  settings,
  number,
  onNumberChange,
  numberError,
  onSubmit,
  onCancel,
  saving,
  saveLabel,
  canSave,
}: AppointmentFormLayoutProps) {
  const { t } = useTranslation()

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <IconButton onClick={onBack} aria-label={t('appointmentForm.backAria')}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h2" component="h1">
          {title}
        </Typography>
      </Stack>

      <Box component="form" onSubmit={onSubmit} noValidate>
        <Stack spacing={3}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '3fr 1fr' }, gap: 3, alignItems: 'start' }}>
            <Stack spacing={3}>
              <Paper variant="outlined" sx={{ p: 4, borderRadius: '12px' }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 4 }}>
                  <CustomerInformationCard value={customer} onChange={onCustomerChange} />
                  <VehicleInformationCard value={vehicle} onChange={onVehicleChange} customerId={customer.customerId} />
                </Box>
              </Paper>

              <Paper variant="outlined" sx={{ p: 4, borderRadius: '12px' }}>
                <Stack spacing={3}>
                  <Typography variant="h4" component="h2">
                    {t('appointmentForm.reasonTitle')}
                  </Typography>
                  <AppointmentReasonsField reasons={reasons} onChange={onReasonsChange} />
                </Stack>
              </Paper>

              <Paper variant="outlined" sx={{ p: 4, borderRadius: '12px' }}>
                <AppointmentTimeSection
                  date={date}
                  onDateChange={onDateChange}
                  minutes={minutes}
                  onMinutesChange={onMinutesChange}
                  settings={settings}
                />
              </Paper>
            </Stack>

            <Paper variant="outlined" sx={{ p: 4, borderRadius: '12px' }}>
              <Stack spacing={3}>
                <Typography variant="h4" component="h2">
                  {t('appointmentForm.numberTitle')}
                </Typography>
                <FormTextField
                  label={t('appointmentForm.numberLabel')}
                  placeholder={t('appointmentForm.numberPlaceholder')}
                  value={number}
                  onChange={(event) => onNumberChange(event.target.value)}
                  error={numberError}
                  helperText={numberError ? t('appointmentForm.numberInUse') : undefined}
                  required
                />
              </Stack>
            </Paper>
          </Box>

          <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
            <Button variant="text" onClick={onCancel} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="contained" loading={saving} disabled={!canSave}>
              {saveLabel}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Stack>
  )
}
