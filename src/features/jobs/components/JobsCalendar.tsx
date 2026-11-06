import { useState, type ReactNode } from 'react'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import { alpha } from '@mui/material/styles'
import { DateTime } from 'luxon'
import { useTranslation } from 'react-i18next'
import { AppDatePicker } from '../../../components/form/AppDatePicker'
import type { CalendarTabProps } from '../types'
import { ServiceBaysCalendarTab } from './ServiceBaysCalendarTab'
import { TechniciansTab } from './TechniciansTab'

export type CalendarTabKey = 'technicians' | 'serviceBays'

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

      {tab === 'technicians' && <TechniciansTab selectedDate={selectedDate} {...tabProps} />}
      {tab === 'serviceBays' && <ServiceBaysCalendarTab selectedDate={selectedDate} {...tabProps} />}
    </Stack>
  )
}
