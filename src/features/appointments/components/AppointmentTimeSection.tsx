import { useState } from 'react'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import type { DateTime } from 'luxon'
import { useTranslation } from 'react-i18next'
import type { AppointmentSettings } from '../../../api/appointmentSettingsApi'
import { AppDatePicker } from '../../../components/form/AppDatePicker'
import { AppTimeField } from '../../../components/form/AppTimeField'
import { minutesToLabel } from '../../../utils/timeGrid'

const MINUTES_IN_DAY = 24 * 60
/** Where a custom time starts when nothing was picked yet and the day has no opening time. */
const FALLBACK_START_MINUTES = 9 * 60

interface AppointmentTimeSectionProps {
  date: DateTime | null
  onDateChange: (value: DateTime | null) => void
  minutes: number | null
  durationMinutes: number
  /** A time slot picks the shop's default duration; a custom time sets both the start and the length. */
  onTimeChange: (minutes: number, durationMinutes: number) => void
  settings: AppointmentSettings
}

export function AppointmentTimeSection({
  date,
  onDateChange,
  minutes,
  durationMinutes,
  onTimeChange,
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

  // An appointment that is not one of the day's slots (e.g. saved earlier with its own time) opens in custom mode.
  const [customMode, setCustomMode] = useState(
    () => minutes !== null && (durationMinutes !== slotMinutes || !slots.includes(minutes)),
  )

  const endMinutes = minutes === null ? null : minutes + durationMinutes
  const invalidRange = customMode && (durationMinutes <= 0 || (endMinutes !== null && endMinutes > MINUTES_IN_DAY))

  function handleSlotClick(start: number) {
    setCustomMode(false)
    onTimeChange(start, slotMinutes)
  }

  function handleCustomClick() {
    setCustomMode(true)

    if (minutes === null) {
      onTimeChange(daySchedule?.isEnabled ? daySchedule.openingTimeMinutes : FALLBACK_START_MINUTES, slotMinutes)
    }
  }

  // Moving the start keeps the length (as far as the day allows); moving the end sets the length.
  function handleStartChange(start: number) {
    onTimeChange(start, Math.min(durationMinutes, MINUTES_IN_DAY - start))
  }

  function handleEndChange(end: number) {
    if (minutes !== null) {
      onTimeChange(minutes, end - minutes)
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

          {date && (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, 136px)', gap: 1 }}>
              {slots.map((start) => (
                <Button
                  key={start}
                  variant={!customMode && minutes === start ? 'contained' : 'outlined'}
                  size="small"
                  sx={{ height: 40, whiteSpace: 'nowrap' }}
                  onClick={() => handleSlotClick(start)}
                >
                  {minutesToLabel(start)} - {minutesToLabel(start + slotMinutes)}
                </Button>
              ))}
              <Button
                variant={customMode ? 'contained' : 'outlined'}
                size="small"
                startIcon={<AccessTimeIcon />}
                sx={{ height: 40, whiteSpace: 'nowrap' }}
                onClick={handleCustomClick}
              >
                {t('appointmentForm.customTime')}
              </Button>
            </Box>
          )}

          {date && customMode && (
            <Stack spacing={1} sx={{ pt: 1 }}>
              <Stack direction="row" spacing={2}>
                <Box sx={{ width: 140 }}>
                  <AppTimeField label={t('appointmentForm.customStart')} value={minutes} onChange={handleStartChange} />
                </Box>
                <Box sx={{ width: 140 }}>
                  <AppTimeField label={t('appointmentForm.customEnd')} value={endMinutes} onChange={handleEndChange} />
                </Box>
              </Stack>
              <Typography variant="caption" sx={{ color: invalidRange ? 'error.main' : 'text.secondary' }}>
                {invalidRange
                  ? t('appointmentForm.customEndError')
                  : t('appointmentForm.customDuration', { minutes: durationMinutes })}
              </Typography>
            </Stack>
          )}
        </Stack>
      </Box>
    </Stack>
  )
}
