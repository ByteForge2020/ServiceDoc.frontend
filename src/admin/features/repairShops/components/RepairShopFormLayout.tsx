import type { FormEvent } from 'react'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { FormSelect, type FormSelectOption } from '../../../../components/form/FormSelect'
import { FormTextField } from '../../../../components/form/FormTextField'

export interface RepairShopFormState {
  name: string
  subdomainName: string
  address: string
  phone: string
  timeZoneId: string
}

interface RepairShopFormLayoutProps {
  title: string
  onBack: () => void
  value: RepairShopFormState
  onChange: (value: RepairShopFormState) => void
  subdomainError: boolean
  subdomainErrorMessage: string
  timeZoneOptions: FormSelectOption<string>[]
  onSubmit: (event: FormEvent) => void
  onCancel: () => void
  saving: boolean
  saveLabel: string
  canSave: boolean
}

export function RepairShopFormLayout({
  title,
  onBack,
  value,
  onChange,
  subdomainError,
  subdomainErrorMessage,
  timeZoneOptions,
  onSubmit,
  onCancel,
  saving,
  saveLabel,
  canSave,
}: RepairShopFormLayoutProps) {
  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <IconButton onClick={onBack} aria-label="Back">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h2" component="h1">
          {title}
        </Typography>
      </Stack>

      <Box component="form" onSubmit={onSubmit} noValidate>
        <Stack spacing={3}>
          <Paper variant="outlined" sx={{ p: 4, borderRadius: '12px' }}>
            <Stack spacing={3} sx={{ maxWidth: 480 }}>
              <FormTextField
                label="Name"
                value={value.name}
                onChange={(event) => onChange({ ...value, name: event.target.value })}
                required
              />

              <FormTextField
                label="Subdomain"
                placeholder="e.g. acme-motors"
                value={value.subdomainName}
                onChange={(event) => onChange({ ...value, subdomainName: event.target.value })}
                error={subdomainError}
                helperText={subdomainError ? subdomainErrorMessage : 'Lowercase letters, digits and hyphens only'}
                required
              />

              <FormTextField
                label="Address"
                value={value.address}
                onChange={(event) => onChange({ ...value, address: event.target.value })}
              />

              <FormTextField
                label="Phone"
                value={value.phone}
                onChange={(event) => onChange({ ...value, phone: event.target.value })}
              />

              <FormSelect
                label="Time Zone"
                placeholder="Select a time zone"
                value={value.timeZoneId}
                onChange={(timeZoneId) => onChange({ ...value, timeZoneId })}
                options={timeZoneOptions}
                required
              />
            </Stack>
          </Paper>

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
