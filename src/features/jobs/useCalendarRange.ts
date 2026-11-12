import { useMemo } from 'react'
import { DateTime } from 'luxon'
import { useShopTimeZone } from '../../app/shop/useShopTimeZone'
import { localDateAndMinutesToUtcIso } from '../../utils/timeGrid'
import { mondayOfWeek } from '../appointments/weekUtils'
import type { CalendarView } from './types'

// An entry that started earlier can still run into the period (its duration counts working hours only, so it can
// last many days), so entries are fetched from this far back. Older ones that are still running aren't shown.
export const LOOKBACK_DAYS = 21

/**
 * The period a calendar shows: the selected day, or its week. `from` / `to` are the UTC bounds its entries are
 * fetched with: `from` reaches `LOOKBACK_DAYS` back before the period, the entries that don't fall on it are not drawn.
 */
export function useCalendarRange(selectedDate: string, view: CalendarView) {
  const zone = useShopTimeZone()

  return useMemo(() => {
    const weekStart = mondayOfWeek(DateTime.fromISO(selectedDate)).toISODate()!
    const startDate = view === 'week' ? weekStart : selectedDate
    const days = view === 'week' ? 7 : 1

    return {
      /** The Monday of the selected date's week. */
      weekStart,
      from: localDateAndMinutesToUtcIso(startDate, -LOOKBACK_DAYS * 24 * 60, zone),
      to: localDateAndMinutesToUtcIso(startDate, days * 24 * 60, zone),
    }
  }, [selectedDate, view, zone])
}
