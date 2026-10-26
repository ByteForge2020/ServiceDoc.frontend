import type { ReactNode } from 'react'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import { DateTime } from 'luxon'
import { useTranslation } from 'react-i18next'
import { AppDatePicker } from '../../../components/form/AppDatePicker'
import { TechniciansTab, type TechniciansTabProps } from './TechniciansTab'

interface JobsCalendarProps extends TechniciansTabProps {
  /** Shown at the left of the date picker, e.g. the page title. */
  heading?: ReactNode
  onSelectedDateChange: (dateIso: string) => void
}

/** The job calendar shared by the Jobs screen and the dialogs opened from a work order: date, tabs and content. */
export function JobsCalendar({ heading, selectedDate, onSelectedDateChange, ...tabProps }: JobsCalendarProps) {
  const { t } = useTranslation()

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

      <Tabs value={0}>
        <Tab label={t('jobs.tabs.technicians')} />
      </Tabs>

      <TechniciansTab selectedDate={selectedDate} {...tabProps} />
    </Stack>
  )
}
