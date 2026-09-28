import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { DateTime } from 'luxon'
import { useTranslation } from 'react-i18next'
import type { AppointmentSettings } from '../../../api/appointmentSettingsApi'
import { AppDatePicker } from '../../../components/form/AppDatePicker'
import { minutesToLabel } from '../../../utils/timeGrid'

interface AppointmentTimeSectionProps {
  date: DateTime | null
  onDateChange: (value: DateTime | null) => void
  minutes: number | null
  onMinutesChange: (value: number) => void
  settings: AppointmentSettings
}

export function AppointmentTimeSection({
  date,
  onDateChange,
  minutes,
  onMinutesChange,
  settings,
}: AppointmentTimeSectionProps) {
  const { t } = useTranslation()

  const slotMinutes = settings.defaultAppointmentDurationMinutes
  const daySchedule = date ? settings.schedule.find((d) => d.dayOfWeek === date.weekday % 7) : undefined

  const slots: number[] = []
  if (daySchedule?.isEnabled) {
    for (
      let start = daySchedule.openingTimeMinutes;
      start + slotMinutes <= daySchedule.closingTimeMinutes;
      start += slotMinutes
    ) {
      slots.push(start)
    }
  }

  return (
    <Stack spacing={3}>
      <Typography variant="h4" component="h2">
        {t('appointmentForm.timeTitle')}
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'auto 1fr' }, gap: 4, alignItems: 'start' }}>
        <Box sx={{ width: { xs: '100%', md: 280 } }}>
          <AppDatePicker label={t('appointmentForm.selectDate')} value={date} onChange={onDateChange} required />
        </Box>

        <Stack spacing={1}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {t('appointmentForm.selectTime')}
            <Box component="span" sx={{ color: 'error.main' }}>
              {' *'}
            </Box>
          </Typography>

          {!date && (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('appointmentForm.selectDateFirst')}
            </Typography>
          )}

          {date && slots.length === 0 && (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('appointmentForm.noSlots')}
            </Typography>
          )}

          {slots.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {slots.map((start) => (
                <Button
                  key={start}
                  variant={minutes === start ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => onMinutesChange(start)}
                >
                  {minutesToLabel(start)} - {minutesToLabel(start + slotMinutes)}
                </Button>
              ))}
            </Box>
          )}
        </Stack>
      </Box>
    </Stack>
  )
}
