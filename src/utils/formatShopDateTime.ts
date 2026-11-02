import { DateTime } from 'luxon'

/** A UTC timestamp from the API as a date and time in the shop's time zone; "—" without one. */
export function formatShopDateTime(value: string | null, zone: string): string {
  if (!value) {
    return '—'
  }

  return DateTime.fromISO(value, { zone: 'utc' }).setZone(zone).toLocaleString(DateTime.DATETIME_MED)
}
