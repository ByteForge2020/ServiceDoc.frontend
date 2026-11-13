import { useMemo, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import AddIcon from '@mui/icons-material/Add'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { alpha, useTheme } from '@mui/material/styles'
import { DateTime } from 'luxon'
import { useTranslation } from 'react-i18next'
import { useShopTimeZone } from '../../../app/shop/useShopTimeZone'
import {
  localDateAndMinutesToUtcIso,
  minutesToLabel,
  snapMinutes,
} from '../../../utils/timeGrid'
import { layoutOverlappingItems, type ColumnPlacement } from '../../appointments/appointmentLayout'
import {
  DAY_COLUMN_MIN_WIDTH,
  HEADER_HEIGHT,
  MIN_CARD_HEIGHT,
  SLOT_GUTTER_WIDTH,
  TIME_COLUMN_WIDTH,
  WEEKDAY_ORDER,
} from '../../appointments/gridConstants'
import { formatWeekRangeLabel, weekDates } from '../../appointments/weekUtils'
import { useAppointmentSettingsQuery } from '../../settings/appointments/queries'
import type { CalendarEntry } from '../types'
import { placeEntriesOnDay, segmentSpan, visiblePart } from '../entrySegments'
import { useDragEdgeNavigation } from '../useDragEdgeNavigation'
import { useEntryPlans } from '../useEntryPlans'
import { gridTimeRange, isOpenAt, openHoursOf, weekOpenSpan } from '../workingHours'
import { AddActionsPopover } from './AddActionsPopover'
import { CalendarEntryCardPreview, type EntryLabels } from './CalendarEntryCard'
import { EdgeIndicator } from './EdgeIndicator'
import type { CalendarAddAction } from './ResourceGrid'
import { WeekEntryCard, type ResourceKind } from './WeekEntryCard'

const HOUR_HEIGHT_PX = 64
const PX_PER_MINUTE = HOUR_HEIGHT_PX / 60
// Coarser than the day view (5 minutes): a minute is about 1px here. The exact time is set in the entry's form.
const SNAP_MINUTES = 15
const MINUTES_PER_DAY = 24 * 60
// A day column is a droppable identified by its position in the week, so it stays valid when the week changes mid-drag.
const COLUMN_ID_PREFIX = 'week-column:'
const COLUMN_ATTRIBUTE = 'data-week-column'

interface DropTarget {
  columnIndex: number
  minutes: number
}

interface HoverState {
  columnIndex: number
  minutes: number
}

interface AddRequest {
  dateIso: string
  minutes: number
  top: number
  left: number
}

interface DayColumnProps {
  columnIndex: number
  height: number
  hourStarts: number[]
  scaleStartMinutes: number
  isOpen: (hourStartMinutes: number) => boolean
  isToday: boolean
  canAdd: boolean
  hover: HoverState | null
  dropPlaceholder: { minutes: number; durationMinutes: number } | null
  onMouseMove: (event: ReactMouseEvent<HTMLDivElement>) => void
  onMouseLeave: () => void
  onClick: (event: ReactMouseEvent<HTMLDivElement>) => void
  children: ReactNode
}

function DayColumn({
  columnIndex,
  height,
  hourStarts,
  scaleStartMinutes,
  isOpen,
  isToday,
  canAdd,
  hover,
  dropPlaceholder,
  onMouseMove,
  onMouseLeave,
  onClick,
  children,
}: DayColumnProps) {
  const { setNodeRef } = useDroppable({ id: `${COLUMN_ID_PREFIX}${columnIndex}` })

  return (
    <Box
      ref={setNodeRef}
      {...{ [COLUMN_ATTRIBUTE]: columnIndex }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      sx={{
        flex: 1,
        minWidth: DAY_COLUMN_MIN_WIDTH,
        height,
        position: 'relative',
        borderLeft: columnIndex > 0 ? '1px solid' : 'none',
        borderColor: 'divider',
        bgcolor: (theme) => (isToday ? alpha(theme.palette.primary.main, 0.04) : 'transparent'),
        // The hover marker only shows where something can be added.
        cursor: canAdd && hover?.columnIndex === columnIndex ? 'pointer' : 'default',
      }}
    >
      {hourStarts.map((minutes, rowIndex) => (
        <Box
          key={minutes}
          sx={{
            position: 'absolute',
            top: rowIndex * HOUR_HEIGHT_PX,
            left: 0,
            right: 0,
            height: HOUR_HEIGHT_PX,
            borderBottom: '1px solid',
            borderColor: 'divider',
            // Hours outside the shop's opening hours (or on a closed day) are shaded.
            bgcolor: isOpen(minutes) ? 'transparent' : 'action.hover',
          }}
        />
      ))}

      {children}

      {dropPlaceholder && (
        <Box
          sx={{
            position: 'absolute',
            top: (dropPlaceholder.minutes - scaleStartMinutes) * PX_PER_MINUTE,
            left: 0,
            right: 0,
            height: Math.max(dropPlaceholder.durationMinutes * PX_PER_MINUTE, MIN_CARD_HEIGHT),
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.2),
            borderTop: '2px solid',
            borderColor: 'primary.main',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        >
          <Typography variant="caption" sx={{ px: '4px', color: 'primary.dark', fontWeight: 600 }}>
            {minutesToLabel(dropPlaceholder.minutes)}
          </Typography>
        </Box>
      )}

      {canAdd && hover && hover.columnIndex === columnIndex && (
        <Box
          sx={{
            position: 'absolute',
            top: (hover.minutes - scaleStartMinutes) * PX_PER_MINUTE,
            left: 0,
            right: 0,
            height: '2px',
            bgcolor: 'primary.main',
            pointerEvents: 'none',
            zIndex: 3,
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 2,
              left: 6,
              px: '4px',
              borderRadius: '6px',
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
            }}
          >
            <Typography variant="caption" sx={{ color: 'inherit' }}>
              {minutesToLabel(hover.minutes)}
            </Typography>
          </Box>
          {/* In the strip no entry covers, which is what a click there adds to. */}
          <Box
            sx={{
              position: 'absolute',
              top: -11,
              right: 0,
              width: SLOT_GUTTER_WIDTH,
              display: 'flex',
              justifyContent: 'center',
              color: 'primary.main',
            }}
          >
            <AddIcon fontSize="small" />
          </Box>
        </Box>
      )}
    </Box>
  )
}

export interface ResourceWeekGridProps {
  /** The Monday of the week shown (YYYY-MM-DD). */
  weekStart: string
  /** What an entry's row is: decides the icon on the cards. */
  resourceKind: ResourceKind
  /** Everything of the week: it decides which hours the grid spans, so the grid doesn't jump when a filter changes. */
  allEntries: CalendarEntry[]
  /** What is drawn. */
  entries: CalendarEntry[]
  /** Preselected in the form that opens when an empty place is clicked; null when no single row is in focus. */
  defaultRowId: string | null
  /** Height the grid may grow to before it scrolls. */
  maxHeight?: string
  /** The buttons offered when an empty place is clicked, one per kind of thing that can be added. */
  addActions: CalendarAddAction[]
  entryLabels: EntryLabels
  /** Called when a dragged entry rests at a screen edge: moves the calendar one week back (-1) or forward (1). */
  onShiftWeek: (direction: -1 | 1) => void
  onEdit: (entry: CalendarEntry) => void
  onDelete: (entry: CalendarEntry) => void
  /** An entry was dropped on another day and/or time; it stays with the same technician or service bay. */
  onMove: (params: { entry: CalendarEntry; rowId: string; rowName: string; scheduledTime: string }) => void
}

/**
 * The week of the technicians' or the service bays' calendar: time down the left, days across the top (like the
 * appointments week), every entry of every row in one grid. Dragging changes the day and time only; who or where is
 * changed in the entry's form. It holds no data of its own: the tabs feed it entries and react to add / edit / delete / move.
 */
export function ResourceWeekGrid({
  weekStart,
  resourceKind,
  allEntries,
  entries,
  defaultRowId,
  maxHeight = 'calc(100vh - 340px)',
  addActions,
  entryLabels,
  onShiftWeek,
  onEdit,
  onDelete,
  onMove,
}: ResourceWeekGridProps) {
  const { i18n } = useTranslation()
  const zone = useShopTimeZone()
  const theme = useTheme()
  const { data: settings } = useAppointmentSettingsQuery()
  // The duration counts working hours only: an entry longer than what is left of its day goes on in the next working
  // day(s), and each day draws its own part of it.
  const plans = useEntryPlans(allEntries)

  const [draggedEntry, setDraggedEntry] = useState<CalendarEntry | null>(null)
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null)
  const [hover, setHover] = useState<HoverState | null>(null)
  const [addRequest, setAddRequest] = useState<AddRequest | null>(null)
  const overIdRef = useRef<string | null>(null)
  const translatedTopRef = useRef<number | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const { pointerXRef, edge } = useDragEdgeNavigation(draggedEntry !== null, onShiftWeek)

  const canAdd = addActions.length > 0
  const dates = useMemo(() => weekDates(weekStart), [weekStart])
  const todayIso = DateTime.now().setZone(zone).toISODate()
  const scheduleByDay = useMemo(
    () => new Map((settings?.schedule ?? []).map((day) => [day.dayOfWeek, day])),
    [settings?.schedule],
  )

  // The working hours of each day of the week; the entries are cut to them. (Not known yet: nothing is cut.)
  const openByDate = useMemo(
    () =>
      new Map(
        dates.map((dateIso) => [
          dateIso,
          settings ? openHoursOf(scheduleByDay.get(DateTime.fromISO(dateIso).weekday % 7)) : null,
        ]),
      ),
    [dates, settings, scheduleByDay],
  )

  // The shop's working hours over the week, widened to the whole hours that hold something scheduled outside them,
  // plus a couple of shaded hours above and below.
  const { startMinutes: scaleStartMinutes, endMinutes: scaleEndMinutes } = useMemo(
    () =>
      gridTimeRange(
        weekOpenSpan(settings?.schedule ?? []),
        dates.flatMap((dateIso) =>
          placeEntriesOnDay(allEntries, dateIso, plans).map(({ segment }) =>
            segmentSpan(segment, openByDate.get(dateIso) ?? null),
          ),
        ),
      ),
    [settings?.schedule, allEntries, dates, openByDate, plans],
  )

  /** Whether the shop is open at `minutes` on the day of column `columnIndex` (always, while the hours are loading). */
  function isOpenInColumn(columnIndex: number, minutes: number): boolean {
    return !settings || isOpenAt(openHoursOf(scheduleByDay.get(WEEKDAY_ORDER[columnIndex])), minutes)
  }

  const hourStarts = useMemo(() => {
    const count = Math.max(Math.ceil((scaleEndMinutes - scaleStartMinutes) / 60), 1)
    return Array.from({ length: count }, (_, i) => scaleStartMinutes + i * 60)
  }, [scaleStartMinutes, scaleEndMinutes])
  const gridHeight = hourStarts.length * HOUR_HEIGHT_PX

  const entriesByDate = useMemo(
    () => new Map(dates.map((dateIso) => [dateIso, placeEntriesOnDay(entries, dateIso, plans)])),
    [dates, entries, plans],
  )

  // Entries that overlap in time share the day's width side by side instead of lying on top of each other.
  const placementsByDate = useMemo(() => {
    const map = new Map<string, Map<string, ColumnPlacement>>()
    const minDurationMinutes = MIN_CARD_HEIGHT / PX_PER_MINUTE

    for (const [dateIso, dayEntries] of entriesByDate) {
      const items = dayEntries.flatMap(({ entry, segment }) => {
        const part = visiblePart(
          segment,
          { startMinutes: scaleStartMinutes, endMinutes: scaleEndMinutes },
          openByDate.get(dateIso) ?? null,
        )
        // A card is never drawn shorter than its minimum height, so it takes that much room when checking overlaps.
        return part
          ? [
              {
                id: entry.id,
                startMinutes: part.startMinutes,
                endMinutes: part.startMinutes + Math.max(part.endMinutes - part.startMinutes, minDurationMinutes),
              },
            ]
          : []
      })
      map.set(dateIso, layoutOverlappingItems(items))
    }

    return map
  }, [entriesByDate, openByDate, scaleStartMinutes, scaleEndMinutes])

  /** The time under a pointer at `clientY` within a day column, snapped. */
  function minutesAt(column: HTMLElement, clientY: number): number {
    const rawMinutes = scaleStartMinutes + (clientY - column.getBoundingClientRect().top) / PX_PER_MINUTE
    return snapMinutes(rawMinutes, SNAP_MINUTES, MINUTES_PER_DAY)
  }

  // The card's top edge decides the start time, and the column under the pointer the day. The column is measured from
  // the DOM now rather than from dnd-kit's cached rects, so scrolling can't skew it.
  function updateDropTarget() {
    const overId = overIdRef.current
    const cardTop = translatedTopRef.current
    const columnIndex = overId?.startsWith(COLUMN_ID_PREFIX) ? Number(overId.slice(COLUMN_ID_PREFIX.length)) : null
    const column = columnIndex === null ? null : document.querySelector<HTMLElement>(`[${COLUMN_ATTRIBUTE}="${columnIndex}"]`)

    let next: DropTarget | null =
      columnIndex === null || !column || cardTop === null ? null : { columnIndex, minutes: minutesAt(column, cardTop) }

    // Closed time takes no entries: dropping an entry's start there does nothing.
    if (next && !isOpenInColumn(next.columnIndex, next.minutes)) {
      next = null
    }

    setDropTarget((previous) =>
      previous?.columnIndex === next?.columnIndex && previous?.minutes === next?.minutes ? previous : next,
    )
    return next
  }

  function finishDrag() {
    overIdRef.current = null
    translatedTopRef.current = null
    setDraggedEntry(null)
    setDropTarget(null)
  }

  function handleDragStart({ active, activatorEvent }: DragStartEvent) {
    // The edge zones are judged from where the pointer starts, not from where it last was.
    if (activatorEvent instanceof PointerEvent) {
      pointerXRef.current = activatorEvent.clientX
    }
    setDraggedEntry((active.data.current?.entry as CalendarEntry | undefined) ?? null)
    setHover(null)
  }

  function handleDragMove({ active, over }: DragMoveEvent) {
    overIdRef.current = over ? String(over.id) : null
    translatedTopRef.current = active.rect.current.translated?.top ?? null
    updateDropTarget()
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    const entry = draggedEntry
    overIdRef.current = over ? String(over.id) : null
    translatedTopRef.current = active.rect.current.translated?.top ?? translatedTopRef.current
    const target = updateDropTarget()
    finishDrag()

    if (!entry || !target) {
      return
    }

    // Only an entry drawn in one piece can be dragged, and where it is dropped is where it starts.
    const scheduledTime = localDateAndMinutesToUtcIso(dates[target.columnIndex], target.minutes, zone)

    const isUnchanged = DateTime.fromISO(entry.scheduledTime).toMillis() === DateTime.fromISO(scheduledTime).toMillis()
    if (isUnchanged) {
      return
    }

    // Who or where stays as it is: only the day and the time are changed by dragging.
    onMove({ entry, rowId: entry.rowId, rowName: entry.rowName, scheduledTime })
  }

  function handleColumnMouseMove(event: ReactMouseEvent<HTMLDivElement>, columnIndex: number) {
    if (canAdd && draggedEntry === null) {
      const minutes = minutesAt(event.currentTarget, event.clientY)
      // Closed time takes no new entries, so there is nothing to point at.
      setHover(isOpenInColumn(columnIndex, minutes) ? { columnIndex, minutes } : null)
    }
  }

  function handleColumnClick(event: ReactMouseEvent<HTMLDivElement>, columnIndex: number) {
    if (!canAdd) {
      return
    }
    const minutes = minutesAt(event.currentTarget, event.clientY)
    if (!isOpenInColumn(columnIndex, minutes)) {
      return
    }
    // With one thing to add there is nothing to choose from: no menu, straight to the form.
    if (addActions.length === 1) {
      addActions[0].onSelect({ rowId: defaultRowId, minutes, dateIso: dates[columnIndex] })
      return
    }
    setAddRequest({
      dateIso: dates[columnIndex],
      minutes,
      top: event.clientY,
      left: event.clientX,
    })
  }

  function handleAddSelect(action: CalendarAddAction) {
    if (!addRequest) {
      return
    }
    action.onSelect({ rowId: defaultRowId, minutes: addRequest.minutes, dateIso: addRequest.dateIso })
    setAddRequest(null)
  }

  function adjacentWeekLabel(offsetWeeks: number): string {
    return formatWeekRangeLabel(DateTime.fromISO(weekStart).plus({ weeks: offsetWeeks }).toISODate()!)
  }

  const minWidth = TIME_COLUMN_WIDTH + DAY_COLUMN_MIN_WIDTH * 7

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        // The screen edges change the week instead, so only the grid's vertical scroll follows the pointer.
        autoScroll={{ threshold: { x: 0, y: 0.2 } }}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onDragCancel={finishDrag}
      >
        <Box
          sx={{
            overflow: 'auto',
            maxHeight,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '12px',
            backgroundColor: 'background.paper',
          }}
        >
          <Box sx={{ display: 'flex', minWidth, position: 'sticky', top: 0, zIndex: 5, bgcolor: 'background.paper' }}>
            <Box
              sx={{
                width: TIME_COLUMN_WIDTH,
                flexShrink: 0,
                position: 'sticky',
                left: 0,
                zIndex: 4,
                height: HEADER_HEIGHT,
                bgcolor: 'background.paper',
                borderRight: '1px solid',
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            />

            {dates.map((dateIso, columnIndex) => {
              const date = DateTime.fromISO(dateIso).setLocale(i18n.language)
              const isToday = dateIso === todayIso

              return (
                <Box
                  key={dateIso}
                  sx={{
                    flex: 1,
                    minWidth: DAY_COLUMN_MIN_WIDTH,
                    height: HEADER_HEIGHT,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderBottom: '1px solid',
                    borderLeft: columnIndex > 0 ? '1px solid' : 'none',
                    borderColor: 'divider',
                    color: isToday ? 'primary.main' : 'text.primary',
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'inherit', textTransform: 'capitalize' }}>
                    {date.toFormat('cccc')}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'inherit', fontWeight: isToday ? 700 : 400 }}>
                    {date.toFormat('d')}
                  </Typography>
                </Box>
              )
            })}
          </Box>

          <Box sx={{ display: 'flex', minWidth }}>
            <Box
              sx={{
                width: TIME_COLUMN_WIDTH,
                flexShrink: 0,
                position: 'sticky',
                left: 0,
                zIndex: 3,
                height: gridHeight,
                bgcolor: 'background.paper',
                borderRight: '1px solid',
                borderColor: 'divider',
              }}
            >
              {hourStarts.map((minutes, rowIndex) => (
                <Box key={minutes} sx={{ height: HOUR_HEIGHT_PX, position: 'relative' }}>
                  <Typography
                    variant="caption"
                    // Centred on its line, except the first one, which would be cut off by the header.
                    sx={{ position: 'absolute', top: rowIndex === 0 ? 2 : -8, right: 4, color: 'text.secondary' }}
                  >
                    {minutesToLabel(minutes)}
                  </Typography>
                </Box>
              ))}
            </Box>

            {WEEKDAY_ORDER.map((dayOfWeek, columnIndex) => {
              const dateIso = dates[columnIndex]
              const daySchedule = scheduleByDay.get(dayOfWeek)
              const dayEntries = entriesByDate.get(dateIso) ?? []
              const dayPlacements = placementsByDate.get(dateIso)

              return (
                <DayColumn
                  key={dayOfWeek}
                  columnIndex={columnIndex}
                  height={gridHeight}
                  hourStarts={hourStarts}
                  scaleStartMinutes={scaleStartMinutes}
                  // Without settings (still loading) nothing is shaded.
                  isOpen={(hourStart) =>
                    !settings ||
                    (!!daySchedule?.isEnabled &&
                      hourStart + 60 > daySchedule.openingTimeMinutes &&
                      hourStart < daySchedule.closingTimeMinutes)
                  }
                  isToday={dateIso === todayIso}
                  canAdd={canAdd}
                  hover={hover}
                  dropPlaceholder={
                    draggedEntry && dropTarget?.columnIndex === columnIndex
                      ? {
                          minutes: dropTarget.minutes,
                          // Dropped where it doesn't fit before closing, it goes on the next working day: only what
                          // fits is shown.
                          durationMinutes: Math.min(
                            draggedEntry.scheduledDurationMinutes,
                            Math.max((openByDate.get(dateIso)?.endMinutes ?? scaleEndMinutes) - dropTarget.minutes, SNAP_MINUTES),
                          ),
                        }
                      : null
                  }
                  onMouseMove={(event) => handleColumnMouseMove(event, columnIndex)}
                  onMouseLeave={() => setHover(null)}
                  onClick={(event) => handleColumnClick(event, columnIndex)}
                >
                  {dayEntries.map(({ entry, segment }) => {
                    const part = visiblePart(
                      segment,
                      { startMinutes: scaleStartMinutes, endMinutes: scaleEndMinutes },
                      openByDate.get(dateIso) ?? null,
                    )
                    if (!part) {
                      return null
                    }

                    const top = (part.startMinutes - scaleStartMinutes) * PX_PER_MINUTE
                    const height = Math.min(
                      Math.max((part.endMinutes - part.startMinutes) * PX_PER_MINUTE, MIN_CARD_HEIGHT),
                      Math.max(gridHeight - top, MIN_CARD_HEIGHT),
                    )
                    const placement = dayPlacements?.get(entry.id)

                    return (
                      <WeekEntryCard
                        // One card per day the entry runs through.
                        key={`${entry.id}:${dateIso}`}
                        entry={entry}
                        segment={segment}
                        dateIso={dateIso}
                        cutBefore={part.cutBefore}
                        cutAfter={part.cutAfter}
                        resourceKind={resourceKind}
                        labels={entryLabels}
                        top={top}
                        height={height}
                        column={placement?.column ?? 0}
                        columnCount={placement?.columnCount ?? 1}
                        onEdit={onEdit}
                        onDelete={onDelete}
                      />
                    )
                  })}
                </DayColumn>
              )
            })}
          </Box>

          <AddActionsPopover
            position={addRequest && canAdd ? { top: addRequest.top, left: addRequest.left } : null}
            actions={addActions}
            onSelect={handleAddSelect}
            onClose={() => setAddRequest(null)}
          />
        </Box>

        {/* Portaled and raised, like the day view's overlay. */}
        {createPortal(
          <DragOverlay dropAnimation={null} zIndex={theme.zIndex.modal + 100}>
            {draggedEntry && (
              <CalendarEntryCardPreview entry={draggedEntry} rangeLabel={plans.get(draggedEntry.id)?.rangeLabel ?? ''} />
            )}
          </DragOverlay>,
          document.body,
        )}
      </DndContext>

      {draggedEntry &&
        createPortal(
          <>
            <EdgeIndicator side="left" active={edge === -1} label={adjacentWeekLabel(-1)} />
            <EdgeIndicator side="right" active={edge === 1} label={adjacentWeekLabel(1)} />
          </>,
          document.body,
        )}
    </>
  )
}
