import { DateTime } from 'luxon'

export function mondayOfWeek(date: DateTime): DateTime {
  return date.minus({ days: date.weekday - 1 }).startOf('day')
}

export function weekDates(weekStartIso: string): string[] {
  const start = DateTime.fromISO(weekStartIso)
  return Array.from({ length: 7 }, (_, i) => start.plus({ days: i }).toISODate()!)
}

export function formatWeekRangeLabel(weekStartIso: string): string {
  const start = DateTime.fromISO(weekStartIso)
  const end = start.plus({ days: 6 })

  if (start.year !== end.year) {
    return `${start.toFormat('LLL d, yyyy')} - ${end.toFormat('LLL d, yyyy')}`
  }
  if (start.month !== end.month) {
    return `${start.toFormat('LLL d')} - ${end.toFormat('LLL d')}`
  }
  return `${start.toFormat('LLL d')} - ${end.toFormat('d')}`
}
