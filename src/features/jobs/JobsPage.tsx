import { useEffect } from 'react'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { useCalendarPreferencesStore } from './calendarPreferencesStore'
import { resetSelectedDate, setSelectedDate, shiftSelectedDate } from './jobsUiSlice'
import { JobsCalendar } from './components/JobsCalendar'

/** The occupancy calendar: where employee time and service bays are scheduled, by day or by week. */
export function JobsPage() {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const selectedDate = useAppSelector((state) => state.jobsUi.selectedDate)
  const view = useCalendarPreferencesStore((state) => state.view)
  const setView = useCalendarPreferencesStore((state) => state.setView)
  const tab = useCalendarPreferencesStore((state) => state.tab)
  const setTab = useCalendarPreferencesStore((state) => state.setTab)

  // The date isn't remembered: leaving the page puts it back on today, so the next visit opens on the current day.
  useEffect(() => () => void dispatch(resetSelectedDate()), [dispatch])

  return (
    <JobsCalendar
      heading={
        <Typography variant="h2" component="h1">
          {t('jobs.title')}
        </Typography>
      }
      view={view}
      onViewChange={setView}
      tab={tab}
      onTabChange={setTab}
      selectedDate={selectedDate}
      onSelectedDateChange={(dateIso) => dispatch(setSelectedDate(dateIso))}
      // A dragged entry resting at the screen edge moves the calendar by what it shows: a day, or a week.
      onShiftDate={(direction) => dispatch(shiftSelectedDate(view === 'week' ? direction * 7 : direction))}
    />
  )
}
