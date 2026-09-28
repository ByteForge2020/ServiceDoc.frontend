import { DateTime } from 'luxon'

export function minutesToLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

export function snapMinutes(rawMinutes: number, snapToMinutes: number, maxMinutes: number): number {
  const snapped = Math.round(rawMinutes / snapToMinutes) * snapToMinutes
  return Math.min(Math.max(snapped, 0), maxMinutes - snapToMinutes)
}

export function offsetXToMinutes(offsetX: number, pxPerMinute: number): number {
  return offsetX / pxPerMinute
}

export function localDateAndMinutesToUtcIso(dateIso: string, minutes: number, zone: string): string {
  return DateTime.fromISO(dateIso, { zone }).plus({ minutes }).toUTC().toISO()!
}

export function utcIsoToMinutesOfDay(iso: string, zone: string): number {
  const dt = DateTime.fromISO(iso, { zone: 'utc' }).setZone(zone)
  return dt.hour * 60 + dt.minute
}

export function formatTimeRange(scheduledTimeIso: string, durationMinutes: number, zone: string): string {
  const start = DateTime.fromISO(scheduledTimeIso, { zone: 'utc' }).setZone(zone)
  const end = start.plus({ minutes: durationMinutes })
  return `${start.toFormat('HH:mm')} – ${end.toFormat('HH:mm')}`
}

export function formatScheduledRange(scheduledTimeIso: string, durationMinutes: number, zone: string): string {
  const start = DateTime.fromISO(scheduledTimeIso, { zone: 'utc' }).setZone(zone)
  const end = start.plus({ minutes: durationMinutes })
  return `${start.toFormat('LLL d, HH:mm')} – ${end.toFormat('HH:mm')}`
}
