import type { DaySchedule } from '../../api/appointmentSettingsApi'
import { PADDING_ROWS } from '../appointments/gridConstants'

const MINUTES_PER_DAY = 24 * 60
const MINUTES_PER_HOUR = 60

/** A stretch of a day, in minutes from midnight. */
export interface TimeRange {
  startMinutes: number
  endMinutes: number
}

/** What something scheduled asks of the time scale; a null side asks for nothing (it runs on beyond the day). */
export interface ScheduledSpan {
  startMinutes: number | null
  endMinutes: number | null
}

// What a calendar spans when the shop has no working day at all.
const FALLBACK_RANGE: TimeRange = { startMinutes: 8 * MINUTES_PER_HOUR, endMinutes: 18 * MINUTES_PER_HOUR }

/** The hours a day is open, or null when it is a day off. */
export function openHoursOf(day: DaySchedule | undefined): TimeRange | null {
  return day?.isEnabled ? { startMinutes: day.openingTimeMinutes, endMinutes: day.closingTimeMinutes } : null
}

/** From the earliest opening to the latest closing of the week; what a calendar shows for a day off. */
export function weekOpenSpan(schedule: DaySchedule[]): TimeRange {
  const enabled = schedule.filter((day) => day.isEnabled)

  if (enabled.length === 0) {
    return FALLBACK_RANGE
  }

  return {
    startMinutes: Math.min(...enabled.map((day) => day.openingTimeMinutes)),
    endMinutes: Math.max(...enabled.map((day) => day.closingTimeMinutes)),
  }
}

/** Whether `minutes` falls within the open hours (null: closed all day). */
export function isOpenAt(open: TimeRange | null, minutes: number): boolean {
  return open !== null && minutes >= open.startMinutes && minutes < open.endMinutes
}

/**
 * The stretch a calendar draws: the open hours, widened to the whole hours that hold something already scheduled
 * outside them (so it is never hidden) to the grid's cell size (`cellMinutes`: an hour for the week grid's rows, half
 * an hour for the day grid's columns), plus `PADDING_ROWS` closed cells on each side so the grid doesn't look cut off.
 */
export function gridTimeRange(base: TimeRange, scheduled: ScheduledSpan[], cellMinutes = MINUTES_PER_HOUR): TimeRange {
  const paddingMinutes = PADDING_ROWS * cellMinutes
  let start = base.startMinutes
  let end = base.endMinutes

  for (const item of scheduled) {
    start = Math.min(start, item.startMinutes ?? start)
    end = Math.max(end, item.endMinutes ?? end)
  }

  return {
    startMinutes: Math.max(Math.floor(start / cellMinutes) * cellMinutes - paddingMinutes, 0),
    endMinutes: Math.min(Math.ceil(end / cellMinutes) * cellMinutes + paddingMinutes, MINUTES_PER_DAY),
  }
}
