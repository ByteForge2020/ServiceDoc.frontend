import { DateTime } from 'luxon'
import { MINUTES_PER_DAY, PX_PER_MINUTE, SNAP_MINUTES } from './gridConstants'

export function minutesToLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

export function snapMinutes(rawMinutes: number): number {
  const snapped = Math.round(rawMinutes / SNAP_MINUTES) * SNAP_MINUTES
  return Math.min(Math.max(snapped, 0), MINUTES_PER_DAY - SNAP_MINUTES)
}

export function offsetXToMinutes(offsetX: number): number {
  return offsetX / PX_PER_MINUTE
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
