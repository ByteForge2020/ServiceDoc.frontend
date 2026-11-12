import { useState, type ReactNode } from 'react'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import { alpha } from '@mui/material/styles'
import { DateTime } from 'luxon'
import { useTranslation } from 'react-i18next'
import { AppDatePicker } from '../../../components/form/AppDatePicker'
import { formatWeekRangeLabel, mondayOfWeek } from '../../appointments/weekUtils'
import type { CalendarTabKey, CalendarTabProps, CalendarView } from '../types'
import { ServiceBaysCalendarTab } from './ServiceBaysCalendarTab'
import { TechniciansTab } from './TechniciansTab'

const CALENDAR_VIEWS: CalendarView[] = ['day', 'week']

/** Tells the two kinds of entries apart: work orders' (solid) and appointments' (dashed, tentative). */
function CalendarLegend() {
  const { t } = useTranslation()

  return (
    <Stack direction="row" spacing={2} sx={{ alignItems: 'center', pb: 1, flexShrink: 0 }}>
      {(['order', 'appointment'] as const).map((kind) => {
        const palette = kind === 'appointment' ? 'appointment' : 'primary'

        return (
          <Stack key={kind} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Box
              sx={{
                width: 16,
                height: 12,
                borderRadius: '4px',
                borderWidth: '1px',
                borderStyle: kind === 'appointment' ? 'dashed' : 'solid',
                borderColor: `${palette}.light`,
                bgcolor: (theme) => alpha(theme.palette[palette].main, kind === 'appointment' ? 0.08 : 0.12),
              }}
            />
            <Typography variant="caption">{t(`jobs.legend.${kind}`)}</Typography>
          </Stack>
        )
      })}
    </Stack>
  )
}

interface JobsCalendarProps extends CalendarTabProps {
  /** Shown at the left of the date picker, e.g. the page title. */
  heading?: ReactNode
  onSelectedDateChange: (dateIso: string) => void
  /** Opens on this tab and disables the other one: in a dialog only one kind of entry is being worked on. */
  lockedTab?: CalendarTabKey
  /** When given, a view selector (day / week) is offered; without it the calendar is always one day. */
  onViewChange?: (view: CalendarView) => void
  /** When given together with `onTabChange`, the tab is kept by the caller (e.g. remembered); otherwise it is local. */
  tab?: CalendarTabKey
  onTabChange?: (tab: CalendarTabKey) => void
}

/** The calendar shared by the Jobs screen and the dialogs opened from a work order: date, tabs and content. */
export function JobsCalendar({
  heading,
  selectedDate,
  onSelectedDateChange,
  lockedTab,
  view = 'day',
  onViewChange,
  tab: controlledTab,
  onTabChange,
  ...tabProps
}: JobsCalendarProps) {
  const { t } = useTranslation()
  const [localTab, setLocalTab] = useState<CalendarTabKey>(lockedTab ?? 'technicians')
  const tab = lockedTab ?? controlledTab ?? localTab
  const setTab = onTabChange ?? setLocalTab
  const isWeek = view === 'week'

  // The arrows step by what the view shows: a day, or a week.
  function handleStep(direction: -1 | 1) {
    const step = isWeek ? { weeks: direction } : { days: direction }
    onSelectedDateChange(DateTime.fromISO(selectedDate, { zone: 'utc' }).plus(step).toISODate()!)
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: heading ? 'space-between' : 'flex-end' }}>
        {heading}
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          {onViewChange && (
            <Select<CalendarView>
              size="small"
              value={view}
              onChange={(event) => onViewChange(event.target.value)}
              inputProps={{ 'aria-label': t('jobs.view.label') }}
              sx={{ width: 140 }}
            >
              {CALENDAR_VIEWS.map((option) => (
                <MenuItem key={option} value={option}>
                  {t(`jobs.view.${option}`)}
                </MenuItem>
              ))}
            </Select>
          )}
          <IconButton
            onClick={() => handleStep(-1)}
            aria-label={t(isWeek ? 'jobs.view.prevWeekAria' : 'jobs.view.prevDayAria')}
          >
            <ChevronLeftIcon />
          </IconButton>
          <IconButton
            onClick={() => handleStep(1)}
            aria-label={t(isWeek ? 'jobs.view.nextWeekAria' : 'jobs.view.nextDayAria')}
          >
            <ChevronRightIcon />
          </IconButton>
          {/* The week is stepped with the arrows, so its range stands where the date picker is in the day view. */}
          <Box sx={{ width: 200 }}>
            {isWeek ? (
              <Typography variant="body1" component="span" sx={{ display: 'block', fontWeight: 600, textAlign: 'center' }}>
                {formatWeekRangeLabel(mondayOfWeek(DateTime.fromISO(selectedDate)).toISODate()!)}
              </Typography>
            ) : (
              <AppDatePicker
                value={DateTime.fromISO(selectedDate, { zone: 'utc' })}
                onChange={(value) => {
                  if (value?.isValid) {
                    onSelectedDateChange(value.toISODate()!)
                  }
                }}
              />
            )}
          </Box>
        </Stack>
      </Stack>

      <Stack direction="row" sx={{ alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <Tabs value={tab} onChange={(_event, value: CalendarTabKey) => setTab(value)}>
          <Tab
            label={t('jobs.tabs.technicians')}
            value="technicians"
            disabled={lockedTab !== undefined && lockedTab !== 'technicians'}
          />
          <Tab
            label={t('jobs.tabs.serviceBays')}
            value="serviceBays"
            disabled={lockedTab !== undefined && lockedTab !== 'serviceBays'}
          />
        </Tabs>
        <CalendarLegend />
      </Stack>

      {tab === 'technicians' && <TechniciansTab selectedDate={selectedDate} view={view} {...tabProps} />}
      {tab === 'serviceBays' && <ServiceBaysCalendarTab selectedDate={selectedDate} view={view} {...tabProps} />}
    </Stack>
  )
}
