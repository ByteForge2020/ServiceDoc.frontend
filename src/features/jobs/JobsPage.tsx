import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { setSelectedDate, shiftSelectedDate } from './jobsUiSlice'
import { JobsCalendar } from './components/JobsCalendar'

export function JobsPage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const selectedDate = useAppSelector((state) => state.jobsUi.selectedDate)

  return (
    <JobsCalendar
      heading={
        <Typography variant="h2" component="h1">
          {t('jobs.title')}
        </Typography>
      }
      selectedDate={selectedDate}
      onSelectedDateChange={(dateIso) => dispatch(setSelectedDate(dateIso))}
      onShiftDate={(direction) => dispatch(shiftSelectedDate(direction))}
    />
  )
}
