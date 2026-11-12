import { DateTime } from 'luxon'
import type { DaySchedule } from '../../api/appointmentSettingsApi'
import type { CalendarEntry } from './types'
import type { ScheduledSpan, TimeRange } from './workingHours'

/**
 * The part of an entry that falls on one day. A planned duration counts working hours only: the time the shop is
 * closed (nights, days off) pauses it, and it goes on from the next opening. So an entry longer than what is left of its
 * working day is drawn on every working day it runs through, one segment each. The entry itself stays one record;
 * only what is drawn is split.
 */
export interface EntrySegment {
  /** Minutes from the day's midnight, within [0, 1440]. */
  startMinutes: number
  endMinutes: number
  /** The entry began on an earlier day. */
  continuesBefore: boolean
  /** The entry runs on into a later day. */
  continuesAfter: boolean
  /** The whole span of the entry as text, e.g. "14:40 – 16 нояб., 15:10"; the same on each of its segments. */
  rangeLabel: string
}

/** An entry together with the part of it that a calendar draws. */
export interface PlacedEntry {
  entry: CalendarEntry
  segment: EntrySegment
}

/** One working stretch of an entry on one day. */
interface WorkInterval {
  dateIso: string
  startMinutes: number
  endMinutes: number
}

/** Where an entry is drawn: its working stretches, in order. */
export interface EntryPlan {
  intervals: WorkInterval[]
  rangeLabel: string
}

// A guard against a pathological duration: the walk over the days stops here.
const MAX_DAYS_WALKED = 1000

function minutesBetween(from: DateTime, to: DateTime): number {
  return Math.round(to.diff(from, 'minutes').minutes)
}

/** The time as it runs on the clock, from the start: used where there are no working hours to count by. */
function clockIntervals(start: DateTime, durationMinutes: number): WorkInterval[] {
  const end = start.plus({ minutes: durationMinutes })
  const intervals: WorkInterval[] = []

  for (let day = start.startOf('day'); day < end && intervals.length < MAX_DAYS_WALKED; day = day.plus({ days: 1 }).startOf('day')) {
    const dayEnd = day.plus({ days: 1 })
    const from = start > day ? start : day
    const to = end < dayEnd ? end : dayEnd
    intervals.push({ dateIso: day.toISODate()!, startMinutes: minutesBetween(day, from), endMinutes: minutesBetween(day, to) })
  }

  return intervals
}

/**
 * Counts `durationMinutes` of work from `start` through the shop's working hours. Work starts at `start`, or at the
 * next opening when that is outside them. Without any working day it runs on the clock.
 */
function workIntervals(start: DateTime, durationMinutes: number, schedule: DaySchedule[] | undefined): WorkInterval[] {
  const openDays = new Map(
    (schedule ?? [])
      .filter((day) => day.isEnabled && day.openingTimeMinutes < day.closingTimeMinutes)
      .map((day) => [day.dayOfWeek, day]),
  )

  if (openDays.size === 0) {
    return clockIntervals(start, durationMinutes)
  }

  const intervals: WorkInterval[] = []
  let remaining = durationMinutes

  let day = start.startOf('day')
  for (let walked = 0; walked < MAX_DAYS_WALKED; walked++, day = day.plus({ days: 1 }).startOf('day')) {
    // Sunday is 0 in the settings; luxon counts it as 7.
    const openDay = openDays.get(day.weekday % 7)
    if (!openDay) {
      continue
    }

    const open = day.plus({ minutes: openDay.openingTimeMinutes })
    const close = day.plus({ minutes: openDay.closingTimeMinutes })
    const from = start > open ? start : open
    if (from >= close) {
      continue
    }

    const take = Math.min(remaining, minutesBetween(from, close))
    const startMinutes = minutesBetween(day, from)
    intervals.push({ dateIso: day.toISODate()!, startMinutes, endMinutes: startMinutes + take })

    remaining -= take
    if (remaining <= 0) {
      return intervals
    }
  }

  return clockIntervals(start, durationMinutes)
}

function describeSpan(intervals: WorkInterval[], zone: string): string {
  const first = intervals[0]
  const last = intervals[intervals.length - 1]
  const startsAt = DateTime.fromISO(first.dateIso, { zone }).plus({ minutes: first.startMinutes })
  const endsAt = DateTime.fromISO(last.dateIso, { zone }).plus({ minutes: last.endMinutes })

  return `${startsAt.toFormat('HH:mm')} – ${endsAt.toFormat(first.dateIso === last.dateIso ? 'HH:mm' : 'd LLL, HH:mm')}`
}

/** Works out where each entry is drawn, from the shop's working hours (`undefined` while they are loading). */
export function planEntries(
  entries: CalendarEntry[],
  schedule: DaySchedule[] | undefined,
  zone: string,
): Map<string, EntryPlan> {
  return new Map(
    entries.map((entry) => {
      const start = DateTime.fromISO(entry.scheduledTime, { zone: 'utc' }).setZone(zone)
      const intervals = workIntervals(start, entry.scheduledDurationMinutes, schedule)

      return [entry.id, { intervals, rangeLabel: describeSpan(intervals, zone) }]
    }),
  )
}

/** The entries' segments on `dateIso`, in the order of `entries`. */
export function placeEntriesOnDay(
  entries: CalendarEntry[],
  dateIso: string,
  plans: Map<string, EntryPlan>,
): PlacedEntry[] {
  return entries.flatMap((entry) => {
    const plan = plans.get(entry.id)
    if (!plan) {
      return []
    }

    return plan.intervals.flatMap((interval, index) =>
      interval.dateIso === dateIso
        ? [
            {
              entry,
              segment: {
                startMinutes: interval.startMinutes,
                endMinutes: interval.endMinutes,
                continuesBefore: index > 0,
                continuesAfter: index < plan.intervals.length - 1,
                rangeLabel: plan.rangeLabel,
              },
            },
          ]
        : [],
    )
  })
}

/** Whether the entry is drawn in more than one piece. Such an entry can't be dragged: its time is set in its form. */
export function isMultiPiece(segment: EntrySegment): boolean {
  return segment.continuesBefore || segment.continuesAfter
}

/** Whether a segment touches the open hours. */
function overlapsOpenHours(segment: EntrySegment, open: TimeRange): boolean {
  return segment.startMinutes < open.endMinutes && segment.endMinutes > open.startMinutes
}

/**
 * What a segment asks of the time scale so that it isn't hidden. A segment that overlaps the open hours is drawn cut
 * to them, so it asks for nothing. One entirely outside them is drawn as it is: its own start (and end) must be on
 * the scale. A segment that goes on past midnight (or came from before it) doesn't stretch the scale to the day's
 * edge: only its own end (or start) has to be visible.
 */
export function segmentSpan(segment: EntrySegment, open: TimeRange | null = null): ScheduledSpan {
  if (open && overlapsOpenHours(segment, open)) {
    return { startMinutes: null, endMinutes: null }
  }

  return {
    startMinutes: segment.continuesBefore ? (segment.continuesAfter ? null : segment.endMinutes - 1) : segment.startMinutes,
    endMinutes: segment.continuesAfter ? (segment.continuesBefore ? null : segment.startMinutes + 1) : segment.endMinutes,
  }
}

/** A segment cut to the stretch of the day a calendar draws. */
export interface VisiblePart {
  startMinutes: number
  endMinutes: number
  /** It goes on before the drawn part: into the cut-off time, or from the previous day. */
  cutBefore: boolean
  /** It goes on after the drawn part: into the cut-off time, or into the next day. */
  cutAfter: boolean
}

/**
 * The part of a segment that is drawn. It is cut to the open hours when it touches them, so a long entry doesn't
 * stretch over the closed time: it stops at closing and goes on from opening the next day. One entirely in closed
 * time is drawn as it is (cut to `range`), so it is never hidden. Null when none of it is drawn.
 */
export function visiblePart(
  segment: EntrySegment,
  range: TimeRange,
  open: TimeRange | null = null,
): VisiblePart | null {
  const clip =
    open && overlapsOpenHours(segment, open)
      ? { startMinutes: Math.max(open.startMinutes, range.startMinutes), endMinutes: Math.min(open.endMinutes, range.endMinutes) }
      : range

  const startMinutes = Math.max(segment.startMinutes, clip.startMinutes)
  const endMinutes = Math.min(segment.endMinutes, clip.endMinutes)

  if (endMinutes <= startMinutes) {
    return null
  }

  return {
    startMinutes,
    endMinutes,
    cutBefore: segment.continuesBefore || segment.startMinutes < clip.startMinutes,
    cutAfter: segment.continuesAfter || segment.endMinutes > clip.endMinutes,
  }
}
