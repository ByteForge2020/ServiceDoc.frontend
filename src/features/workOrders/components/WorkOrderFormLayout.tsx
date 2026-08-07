import type { FormEvent } from 'react'
import { useState } from 'react'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import type { EstimateFormState } from '../workOrderForm'
import { CustomerInformationCard, type CustomerFormState } from './CustomerInformationCard'
import { EstimateTab } from './estimate/EstimateTab'
import { OrderInformationCard } from './OrderInformationCard'
import { VehicleInformationCard, type VehicleFormState } from './VehicleInformationCard'

interface WorkOrderFormLayoutProps {
  title: string
  onBack: () => void
  customer: CustomerFormState
  onCustomerChange: (value: CustomerFormState) => void
  vehicle: VehicleFormState
  onVehicleChange: (value: VehicleFormState) => void
  orderNumber: string
  onOrderNumberChange: (value: string) => void
  orderNumberError: boolean
  notes: string
  onNotesChange: (value: string) => void
  estimates: EstimateFormState[]
  onEstimatesChange: (value: EstimateFormState[]) => void
  onSubmit: (event: FormEvent) => void
  onCancel: () => void
  saving: boolean
  saveLabel: string
  canSave: boolean
}

export function WorkOrderFormLayout({
  title,
  onBack,
  customer,
  onCustomerChange,
  vehicle,
  onVehicleChange,
  orderNumber,
  onOrderNumberChange,
  orderNumberError,
  notes,
  onNotesChange,
  estimates,
  onEstimatesChange,
  onSubmit,
  onCancel,
  saving,
  saveLabel,
  canSave,
}: WorkOrderFormLayoutProps) {
  const { t } = useTranslation()
  const [tab, setTab] = useState(0)

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <IconButton onClick={onBack} aria-label={t('workOrderForm.backAria')}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h2" component="h1">
          {title}
        </Typography>
      </Stack>

      <Box component="form" onSubmit={onSubmit} noValidate>
        <Stack spacing={3}>
          <Tabs value={tab} onChange={(_event, newValue: number) => setTab(newValue)}>
            <Tab label={t('workOrderForm.generalInformation')} value={0} />
            <Tab label={t('workOrderForm.estimate')} value={1} />
          </Tabs>

          {tab === 0 && (
            <Paper variant="outlined" sx={{ p: 4, borderRadius: '12px' }}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                  alignItems: 'start',
                  gap: 4,
                }}
              >
                <CustomerInformationCard value={customer} onChange={onCustomerChange} />
                <VehicleInformationCard value={vehicle} onChange={onVehicleChange} customerId={customer.customerId} />
                <OrderInformationCard
                  orderNumber={orderNumber}
                  onOrderNumberChange={onOrderNumberChange}
                  orderNumberError={orderNumberError}
                  notes={notes}
                  onNotesChange={onNotesChange}
                />
              </Box>
            </Paper>
          )}

          {tab === 1 && (
            <Paper variant="outlined" sx={{ p: 4, borderRadius: '12px' }}>
              <EstimateTab estimates={estimates} onEstimatesChange={onEstimatesChange} />
            </Paper>
          )}

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
