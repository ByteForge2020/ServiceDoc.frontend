import Box from '@mui/material/Box'
import type { DateTime } from 'luxon'
import { useTranslation } from 'react-i18next'
import { AppDatePicker } from '../../../components/form/AppDatePicker'
import { AppTimeField } from '../../../components/form/AppTimeField'

interface SlotScheduleFieldsProps {
  startDate: DateTime
  startMinutes: number
  durationMinutes: number
  onStartDateChange: (value: DateTime) => void
  onStartMinutesChange: (value: number) => void
  onDurationMinutesChange: (value: number) => void
}

/** Start date, start time and duration: the "when" part shared by every form that books time (jobs, bays, appointments). */
export function SlotScheduleFields({
  startDate,
  startMinutes,
  durationMinutes,
  onStartDateChange,
  onStartMinutesChange,
  onDurationMinutesChange,
}: SlotScheduleFieldsProps) {
  const { t } = useTranslation()

  return (
    <>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
        <AppDatePicker
          label={t('jobs.addJobModal.startDate')}
          value={startDate}
          onChange={(value) => value && onStartDateChange(value)}
          required
        />
        <AppTimeField
          label={t('jobs.addJobModal.startHour')}
          value={startMinutes}
          onChange={onStartMinutesChange}
          stepMinutes={5}
          required
        />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
        <AppTimeField
          label={t('jobs.addJobModal.scheduledDuration')}
          value={durationMinutes}
          onChange={onDurationMinutesChange}
          stepMinutes={15}
          required
        />
      </Box>
    </>
  )
}
