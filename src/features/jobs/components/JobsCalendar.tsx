import { useState, type ReactNode } from 'react'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import { DateTime } from 'luxon'
import { useTranslation } from 'react-i18next'
import { AppDatePicker } from '../../../components/form/AppDatePicker'
import type { CalendarTabProps } from '../types'
import { ServiceBaysCalendarTab } from './ServiceBaysCalendarTab'
import { TechniciansTab } from './TechniciansTab'

export type CalendarTabKey = 'technicians' | 'serviceBays'

interface JobsCalendarProps extends CalendarTabProps {
  /** Shown at the left of the date picker, e.g. the page title. */
  heading?: ReactNode
  onSelectedDateChange: (dateIso: string) => void
  /** Opens on this tab and disables the other one: in a dialog only one kind of entry is being worked on. */
  lockedTab?: CalendarTabKey
}

/** The calendar shared by the Jobs screen and the dialogs opened from a work order: date, tabs and content. */
export function JobsCalendar({
  heading,
  selectedDate,
  onSelectedDateChange,
  lockedTab,
  ...tabProps
}: JobsCalendarProps) {
  const { t } = useTranslation()
  const [tab, setTab] = useState<CalendarTabKey>(lockedTab ?? 'technicians')

  return (
    <Stack spacing={3}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: heading ? 'space-between' : 'flex-end' }}>
        {heading}
        <Box sx={{ width: 200 }}>
          <AppDatePicker
            value={DateTime.fromISO(selectedDate, { zone: 'utc' })}
            onChange={(value) => {
              if (value?.isValid) {
                onSelectedDateChange(value.toISODate()!)
              }
            }}
          />
        </Box>
      </Stack>

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

      {tab === 'technicians' && <TechniciansTab selectedDate={selectedDate} {...tabProps} />}
      {tab === 'serviceBays' && <ServiceBaysCalendarTab selectedDate={selectedDate} {...tabProps} />}
    </Stack>
  )
}
