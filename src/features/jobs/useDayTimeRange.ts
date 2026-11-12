import { useMemo } from 'react'
import { DateTime } from 'luxon'
import { useAppointmentSettingsQuery } from '../settings/appointments/queries'
import { segmentSpan, type PlacedEntry } from './entrySegments'
import { SLOT_MINUTES } from './gridConstants'
import { gridTimeRange, openHoursOf, weekOpenSpan, type TimeRange } from './workingHours'

/**
 * What the day calendar draws for `selectedDate`, from the shop's working hours:
 * `range` is the stretch of the day shown (the open hours, the entries outside them, and a few closed columns around),
 * `open` the hours that can take new entries (null on a day off).
 */
export function useDayTimeRange(
  selectedDate: string,
  placedEntries: PlacedEntry[],
): { range: TimeRange; open: TimeRange | null } {
  const { data: settings } = useAppointmentSettingsQuery()

  return useMemo(() => {
    // Sunday is 0 in the settings; luxon counts it as 7.
    const dayOfWeek = DateTime.fromISO(selectedDate).weekday % 7
    const dayOpen = settings ? openHoursOf(settings.schedule.find((day) => day.dayOfWeek === dayOfWeek)) : null

    // A day off shows the week's usual span, all of it closed.
    const base = dayOpen ?? weekOpenSpan(settings?.schedule ?? [])
    const range = gridTimeRange(base, placedEntries.map(({ segment }) => segmentSpan(segment, dayOpen)), SLOT_MINUTES)

    // Without settings (still loading) nothing is closed.
    return { range, open: settings ? dayOpen : range }
  }, [selectedDate, settings, placedEntries])
}
