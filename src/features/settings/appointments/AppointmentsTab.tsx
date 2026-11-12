import { useState, type FormEvent } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { extractErrorMessage } from '../../../api/errorMessage'
import { FormSelect, type FormSelectOption } from '../../../components/form/FormSelect'
import { useToasters } from '../../../app/toasters/useToasters'
import { useAppointmentSettingsQuery, useUpdateAppointmentSettingsMutation } from './queries'

const DURATION_OPTIONS_MINUTES = [5, 10, 15, 20, 30, 45, 60, 90, 120]

/** The appointment settings; the shop's working hours live in the location info tab. */
export function AppointmentsTab() {
  const { t } = useTranslation()
  const toasters = useToasters()
  const { data, isPending } = useAppointmentSettingsQuery()
  const mutation = useUpdateAppointmentSettingsMutation()

  const [duration, setDuration] = useState<number | null>(null)

  if (data && duration === null) {
    setDuration(data.defaultAppointmentDurationMinutes)
  }

  const durationOptions: FormSelectOption<number>[] = DURATION_OPTIONS_MINUTES.map((minutes) => ({
    value: minutes,
    label: t('appointments.durationOptionLabel', { minutes }),
  }))

  function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (duration === null || mutation.isPending) {
      return
    }

    mutation.mutate(duration, {
      onSuccess: () => toasters.success(t('appointments.saveSuccess')),
      onError: (error) => toasters.error(extractErrorMessage(error, t('appointments.saveError'))),
    })
  }

  if (isPending || duration === null) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Stack spacing={3}>
        <Paper variant="outlined" sx={{ p: 4, borderRadius: '12px' }}>
          <Stack spacing={3} sx={{ maxWidth: 320 }}>
            <Typography variant="h3" component="h2">
              {t('appointments.defaultDurationTitle')}
            </Typography>
            <FormSelect
              label={t('appointments.defaultDurationLabel')}
              value={duration}
              onChange={(minutes) => setDuration((previous) => (minutes !== '' ? minutes : previous))}
              options={durationOptions}
              required
            />
          </Stack>
        </Paper>

        <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
          <Button type="submit" variant="contained" loading={mutation.isPending}>
            {t('appointments.saveLabel')}
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}
