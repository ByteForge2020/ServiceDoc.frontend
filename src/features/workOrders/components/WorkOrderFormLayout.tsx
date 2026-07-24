import type { FormEvent } from 'react'
import { useState } from 'react'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import { CustomerInformationCard, type CustomerFormState } from './CustomerInformationCard'
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
  onSubmit,
  onCancel,
  saving,
  saveLabel,
  canSave,
}: WorkOrderFormLayoutProps) {
  const [tab, setTab] = useState(0)

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <IconButton onClick={onBack} aria-label="Back to work orders">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h2" component="h1">
          {title}
        </Typography>
      </Stack>

      <Box component="form" onSubmit={onSubmit} noValidate>
        <Stack spacing={3}>
          <Tabs value={tab} onChange={(_event, newValue: number) => setTab(newValue)}>
            <Tab label="General Information" value={0} />
            <Tab label="Estimate" value={1} disabled />
          </Tabs>

          {tab === 0 && (
            <Stack spacing={3} sx={{ maxWidth: 720 }}>
              <CustomerInformationCard value={customer} onChange={onCustomerChange} />
              <VehicleInformationCard value={vehicle} onChange={onVehicleChange} customerId={customer.customerId} />
              <OrderInformationCard
                orderNumber={orderNumber}
                onOrderNumberChange={onOrderNumberChange}
                orderNumberError={orderNumberError}
                notes={notes}
                onNotesChange={onNotesChange}
              />
            </Stack>
          )}

          <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
            <Button variant="text" onClick={onCancel} disabled={saving}>
              Cancel
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
