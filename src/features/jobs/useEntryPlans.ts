import { useMemo } from 'react'
import { useShopTimeZone } from '../../app/shop/useShopTimeZone'
import { useAppointmentSettingsQuery } from '../settings/appointments/queries'
import { planEntries, type EntryPlan } from './entrySegments'
import type { CalendarEntry } from './types'

/** Where each entry is drawn, counting its duration through the shop's working hours. */
export function useEntryPlans(entries: CalendarEntry[]): Map<string, EntryPlan> {
  const zone = useShopTimeZone()
  const { data: settings } = useAppointmentSettingsQuery()

  return useMemo(() => planEntries(entries, settings?.schedule, zone), [entries, settings?.schedule, zone])
}
