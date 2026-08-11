import type { FormEvent } from 'react'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { FormSelect } from '../../../../components/form/FormSelect'
import { FormTextField } from '../../../../components/form/FormTextField'
import type { Role } from '../types'

export interface TeamMemberFormState {
  firstName: string
  lastName: string
  email: string
  role: Role | ''
  password: string
}

interface TeamMemberFormLayoutProps {
  title: string
  onBack: () => void
  value: TeamMemberFormState
  onChange: (value: TeamMemberFormState) => void
  emailError: boolean
  emailErrorMessage: string
  passwordHelperText?: string
  passwordRequired: boolean
  onSubmit: (event: FormEvent) => void
  onCancel: () => void
  saving: boolean
  saveLabel: string
  canSave: boolean
}

export function TeamMemberFormLayout({
  title,
  onBack,
  value,
  onChange,
  emailError,
  emailErrorMessage,
  passwordHelperText,
  passwordRequired,
  onSubmit,
  onCancel,
  saving,
  saveLabel,
  canSave,
}: TeamMemberFormLayoutProps) {
  const { t } = useTranslation()

  const roleOptions: { value: Role; label: string }[] = [
    { value: 'Administrator', label: t('teamMemberForm.roles.administrator') },
    { value: 'Technician', label: t('teamMemberForm.roles.technician') },
    { value: 'Owner', label: t('teamMemberForm.roles.owner') },
  ]

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <IconButton onClick={onBack} aria-label={t('teamMemberForm.backAria')}>
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
                label={t('teamMemberForm.firstName')}
                value={value.firstName}
                onChange={(event) => onChange({ ...value, firstName: event.target.value })}
                required
              />

              <FormTextField
                label={t('teamMemberForm.lastName')}
                value={value.lastName}
                onChange={(event) => onChange({ ...value, lastName: event.target.value })}
                required
              />

              <FormTextField
                label={t('teamMemberForm.email')}
                type="email"
                value={value.email}
                onChange={(event) => onChange({ ...value, email: event.target.value })}
                error={emailError}
                helperText={emailError ? emailErrorMessage : undefined}
                required
              />

              <FormSelect
                label={t('teamMemberForm.role')}
                placeholder={t('teamMemberForm.selectRole')}
                value={value.role}
                onChange={(role) => onChange({ ...value, role })}
                options={roleOptions}
                required
              />

              <FormTextField
                label={t('teamMemberForm.password')}
                type="password"
                autoComplete="new-password"
                value={value.password}
                onChange={(event) => onChange({ ...value, password: event.target.value })}
                helperText={passwordHelperText}
                required={passwordRequired}
              />
            </Stack>
          </Paper>

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
