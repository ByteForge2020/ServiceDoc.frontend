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

export function dateAndMinutesToUtcIso(dateIso: string, minutes: number): string {
  return DateTime.fromISO(dateIso, { zone: 'utc' }).plus({ minutes }).toISO()!
}

export function utcIsoToMinutesOfDay(iso: string): number {
  const dt = DateTime.fromISO(iso, { zone: 'utc' })
  return dt.hour * 60 + dt.minute
}

const DURATION_PRESET_MINUTES = [15, 30, 45, 60, 75, 90, 105, 120, 150, 180, 210, 240]

export function formatDurationLabel(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  const parts: string[] = []
  if (hours > 0) {
    parts.push(`${hours} hr`)
  }
  if (minutes > 0 || hours === 0) {
    parts.push(`${minutes} min`)
  }
  return parts.join(' ')
}

export function durationPresetOptions(): string[] {
  return DURATION_PRESET_MINUTES.map(formatDurationLabel)
}

export function parseDurationMinutes(text: string): number | null {
  const trimmed = text.trim().toLowerCase()
  if (trimmed.length === 0) {
    return null
  }

  if (/^\d+$/.test(trimmed)) {
    return Number.parseInt(trimmed, 10)
  }

  const hhmm = trimmed.match(/^(\d+):(\d{1,2})$/)
  if (hhmm) {
    return Number.parseInt(hhmm[1], 10) * 60 + Number.parseInt(hhmm[2], 10)
  }

  const hoursMatch = trimmed.match(/(\d+)\s*h(?:r|rs|our|ours)?/)
  const minutesMatch = trimmed.match(/(\d+)\s*m(?:in|ins)?/)

  if (!hoursMatch && !minutesMatch) {
    return null
  }

  const hours = hoursMatch ? Number.parseInt(hoursMatch[1], 10) : 0
  const minutes = minutesMatch ? Number.parseInt(minutesMatch[1], 10) : 0
  return hours * 60 + minutes
}

export function formatTimeRange(scheduledTimeIso: string, durationMinutes: number): string {
  const start = DateTime.fromISO(scheduledTimeIso, { zone: 'utc' })
  const end = start.plus({ minutes: durationMinutes })
  return `${start.toFormat('HH:mm')} – ${end.toFormat('HH:mm')}`
}
