import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import { DateTime } from 'luxon'
import { useTranslation } from 'react-i18next'
import { AppDatePicker } from '../../components/form/AppDatePicker'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { setSelectedDate } from './jobsUiSlice'
import { TechniciansTab } from './components/TechniciansTab'

export function JobsPage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const selectedDate = useAppSelector((state) => state.jobsUi.selectedDate)

  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h2" component="h1">
          {t('jobs.title')}
        </Typography>
        <Box sx={{ width: 200 }}>
          <AppDatePicker
            value={DateTime.fromISO(selectedDate, { zone: 'utc' })}
            onChange={(value) => {
              if (value?.isValid) {
                dispatch(setSelectedDate(value.toISODate()!))
              }
            }}
          />
        </Box>
      </Stack>

      <Tabs value={0}>
        <Tab label={t('jobs.tabs.technicians')} />
      </Tabs>

      <TechniciansTab selectedDate={selectedDate} />
    </Stack>
  )
}
