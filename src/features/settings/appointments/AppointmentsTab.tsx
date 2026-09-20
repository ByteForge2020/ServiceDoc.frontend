import { Fragment, useState, type FormEvent } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { extractErrorMessage } from '../../../api/errorMessage'
import type { AppointmentSettings, DaySchedule } from '../../../api/appointmentSettingsApi'
import { AppTimeField } from '../../../components/form/AppTimeField'
import { FormSelect, type FormSelectOption } from '../../../components/form/FormSelect'
import { useToasters } from '../../../app/toasters/useToasters'
import { useAppointmentSettingsQuery, useUpdateAppointmentSettingsMutation } from './queries'

const DURATION_OPTIONS_MINUTES = [5, 10, 15, 20, 30, 45, 60, 90, 120]

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

const DAY_LABEL_KEYS: Record<number, string> = {
  0: 'appointments.days.sunday',
  1: 'appointments.days.monday',
  2: 'appointments.days.tuesday',
  3: 'appointments.days.wednesday',
  4: 'appointments.days.thursday',
  5: 'appointments.days.friday',
  6: 'appointments.days.saturday',
}

export function AppointmentsTab() {
  const { t } = useTranslation()
  const toasters = useToasters()
  const { data, isPending } = useAppointmentSettingsQuery()
  const mutation = useUpdateAppointmentSettingsMutation()

  const [value, setValue] = useState<AppointmentSettings | null>(null)

  if (data && !value) {
    setValue(data)
  }

  const durationOptions: FormSelectOption<number>[] = DURATION_OPTIONS_MINUTES.map((minutes) => ({
    value: minutes,
    label: t('appointments.durationOptionLabel', { minutes }),
  }))

  function updateDay(dayOfWeek: number, patch: Partial<DaySchedule>) {
    setValue((prev) =>
      prev
        ? {
            ...prev,
            schedule: prev.schedule.map((day) => (day.dayOfWeek === dayOfWeek ? { ...day, ...patch } : day)),
          }
        : prev,
    )
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (!value || mutation.isPending) {
      return
    }

    mutation.mutate(value, {
      onSuccess: () => toasters.success(t('appointments.saveSuccess')),
      onError: (error) => toasters.error(extractErrorMessage(error, t('appointments.saveError'))),
    })
  }

  if (isPending || !value) {
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
              value={value.defaultAppointmentDurationMinutes}
              onChange={(minutes) =>
                setValue((prev) => (prev && minutes !== '' ? { ...prev, defaultAppointmentDurationMinutes: minutes } : prev))
              }
              options={durationOptions}
              required
            />
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: 4, borderRadius: '12px' }}>
          <Stack spacing={3}>
            <Typography variant="h3" component="h2">
              {t('appointments.scheduleTitle')}
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '200px 1fr 1fr',
                columnGap: 3,
                rowGap: 2,
                alignItems: 'center',
              }}
            >
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                {t('appointments.weekdaysLabel')}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                {t('appointments.openingTimeLabel')}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                {t('appointments.closingTimeLabel')}
              </Typography>

              {DAY_ORDER.map((dayOfWeek) => {
                const day = value.schedule.find((d) => d.dayOfWeek === dayOfWeek)
                if (!day) {
                  return null
                }

                return (
                  <Fragment key={dayOfWeek}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <Switch
                        checked={day.isEnabled}
                        onChange={(event) => updateDay(dayOfWeek, { isEnabled: event.target.checked })}
                      />
                      <Typography variant="body1" sx={{ color: day.isEnabled ? 'text.primary' : 'text.secondary' }}>
                        {t(DAY_LABEL_KEYS[dayOfWeek])}
                      </Typography>
                    </Stack>
                    <AppTimeField
                      value={day.openingTimeMinutes}
                      onChange={(minutes) => updateDay(dayOfWeek, { openingTimeMinutes: minutes })}
                      disabled={!day.isEnabled}
                    />
                    <AppTimeField
                      value={day.closingTimeMinutes}
                      onChange={(minutes) => updateDay(dayOfWeek, { closingTimeMinutes: minutes })}
                      disabled={!day.isEnabled}
                    />
                  </Fragment>
                )
              })}
            </Box>
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
