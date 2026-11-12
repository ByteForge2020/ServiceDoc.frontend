import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react'
import { useDndContext, useDroppable } from '@dnd-kit/core'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { alpha } from '@mui/material/styles'
import {
  HEADER_HEIGHT,
  MINUTES_PER_DAY,
  NAME_COLUMN_WIDTH,
  PX_PER_MINUTE,
  ROW_HEIGHT,
  SLOT_MINUTES,
  SNAP_MINUTES,
} from '../gridConstants'
import type { PlacedEntry } from '../entrySegments'
import type { CalendarEntry, CalendarRow } from '../types'
import { ENTRY_ID_ATTRIBUTE, TIMELINE_ATTRIBUTE } from '../technicianUtils'
import { isOpenAt, type TimeRange } from '../workingHours'
import { minutesToLabel, offsetXToMinutes, snapMinutes } from '../../../utils/timeGrid'
import { AddActionsPopover } from './AddActionsPopover'
import { CalendarEntryCard, type EntryLabels } from './CalendarEntryCard'

interface HoverState {
  rowId: string
  minutes: number
}

interface PopoverState {
  rowId: string
  minutes: number
  top: number
  left: number
}

export interface DropPlaceholder {
  rowId: string
  minutes: number
  durationMinutes: number
}

/** Where an empty slot was clicked. */
export interface AddParams {
  /** The row of the click; null in the week view, where the row is chosen in the form. */
  rowId: string | null
  minutes: number
  /** The day of the click; set by the week view, where the day isn't the calendar's selected date. */
  dateIso?: string
}

/** One thing that can be added at a clicked empty slot (e.g. a job for a work order, or for an appointment). */
export interface CalendarAddAction {
  key: string
  label: string
  onSelect: (params: AddParams) => void
}

interface ResourceGridProps {
  rows: CalendarRow[]
  /** What is drawn: each entry with its part on the day shown. */
  placed: PlacedEntry[]
  /** The stretch of the day the grid draws. */
  timeRange: TimeRange
  /** The working hours within it (null: a day off). Time outside them is shaded and can't take a new entry. */
  openHours: TimeRange | null
  /** Where the dragged entry will land if dropped now; rendered underneath the drag overlay. */
  dropPlaceholder: DropPlaceholder | null
  /** Entries for which this returns false are shown dimmed, with no menu and no dragging. */
  isEntryEditable: (entry: CalendarEntry) => boolean
  /** Whether clicking an empty slot offers to add something there. */
  canAdd: boolean
  /** An entry to scroll into the middle of the view (and pulse) when the grid first appears. */
  focusEntryId?: string
  /** Height the grid may grow to before it scrolls; sized for the full page by default. */
  maxHeight?: string
  /** Shown instead of rows when there are none. */
  emptyRowsText: ReactNode
  /** The buttons offered when an empty slot is clicked, one per kind of thing that can be added. */
  addActions: CalendarAddAction[]
  entryLabels: EntryLabels
  onEdit: (entry: CalendarEntry) => void
  onDelete: (entry: CalendarEntry) => void
}

interface TimelineDropRowProps {
  rowId: string
  width: number
  clickable: boolean
  children: ReactNode
  onMouseMove: (event: ReactMouseEvent<HTMLDivElement>) => void
  onMouseLeave: () => void
  onClick: (event: ReactMouseEvent<HTMLDivElement>) => void
}

function TimelineDropRow({ rowId, width, clickable, children, onMouseMove, onMouseLeave, onClick }: TimelineDropRowProps) {
  const { setNodeRef } = useDroppable({ id: rowId })

  return (
    <Box
      ref={setNodeRef}
      {...{ [TIMELINE_ATTRIBUTE]: rowId }}
      sx={{
        width,
        height: ROW_HEIGHT,
        position: 'relative',
        borderBottom: '1px solid',
        borderColor: 'divider',
        backgroundImage: (theme) =>
          `repeating-linear-gradient(to right, transparent 0, transparent ${SLOT_MINUTES * PX_PER_MINUTE - 1}px, ${theme.palette.divider} ${SLOT_MINUTES * PX_PER_MINUTE - 1}px, ${theme.palette.divider} ${SLOT_MINUTES * PX_PER_MINUTE}px)`,
        cursor: clickable ? 'pointer' : 'default',
      }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      {children}
    </Box>
  )
}

/** The day grid shared by the calendars: one row per resource, entries positioned by their start time. */
export function ResourceGrid({
  rows,
  placed,
  timeRange,
  openHours,
  dropPlaceholder,
  isEntryEditable,
  canAdd,
  focusEntryId,
  maxHeight = 'calc(100vh - 260px)',
  emptyRowsText,
  addActions,
  entryLabels,
  onEdit,
  onDelete,
}: ResourceGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const originMinutes = timeRange.startMinutes
  const dayWidth = (timeRange.endMinutes - originMinutes) * PX_PER_MINUTE
  const slotTicks = Array.from(
    { length: Math.ceil((timeRange.endMinutes - originMinutes) / SLOT_MINUTES) },
    (_, i) => originMinutes + i * SLOT_MINUTES,
  )
  // The shaded parts of the day: before opening and after closing, or all of it on a day off.
  const closedSpans: TimeRange[] = openHours
    ? [
        { startMinutes: originMinutes, endMinutes: openHours.startMinutes },
        { startMinutes: openHours.endMinutes, endMinutes: timeRange.endMinutes },
      ].filter((span) => span.endMinutes > span.startMinutes)
    : [timeRange]
  const [hover, setHover] = useState<HoverState | null>(null)
  const [popover, setPopover] = useState<PopoverState | null>(null)
  const isDragging = useDndContext().active !== null

  useEffect(() => {
    const container = scrollRef.current
    if (!container) {
      return
    }

    const card = focusEntryId
      ? container.querySelector<HTMLElement>(`[${ENTRY_ID_ATTRIBUTE}="${CSS.escape(focusEntryId)}"]`)
      : null

    if (!card) {
      container.scrollLeft = 0
      return
    }

    // Centre the card in the part of the grid that is actually visible (below the sticky header, right of the sticky names).
    const containerRect = container.getBoundingClientRect()
    const cardRect = card.getBoundingClientRect()
    const visibleCenterX = containerRect.left + NAME_COLUMN_WIDTH + (containerRect.width - NAME_COLUMN_WIDTH) / 2
    const visibleCenterY = containerRect.top + HEADER_HEIGHT + (containerRect.height - HEADER_HEIGHT) / 2
    container.scrollLeft += cardRect.left + cardRect.width / 2 - visibleCenterX
    container.scrollTop += cardRect.top + cardRect.height / 2 - visibleCenterY
  }, [focusEntryId])

  /** The time under the pointer within a row's timeline, snapped. */
  function minutesAt(event: ReactMouseEvent<HTMLDivElement>): number {
    const offsetX = event.clientX - event.currentTarget.getBoundingClientRect().left
    return snapMinutes(originMinutes + offsetXToMinutes(offsetX, PX_PER_MINUTE), SNAP_MINUTES, MINUTES_PER_DAY)
  }

  function handleMouseMove(event: ReactMouseEvent<HTMLDivElement>, rowId: string) {
    if (!canAdd) {
      return
    }

    const minutes = minutesAt(event)
    // Closed time takes no new entries, so there is nothing to point at.
    setHover(isOpenAt(openHours, minutes) ? { rowId, minutes } : null)
  }

  function handleMouseLeave() {
    setHover(null)
  }

  function handleClick(event: ReactMouseEvent<HTMLDivElement>, row: CalendarRow) {
    if (!canAdd) {
      return
    }

    const minutes = minutesAt(event)
    if (!isOpenAt(openHours, minutes)) {
      return
    }

    setPopover({
      rowId: row.id,
      minutes,
      top: event.clientY,
      left: event.clientX,
    })
  }

  function handlePopoverClose() {
    setPopover(null)
  }

  function handleAddClick(action: CalendarAddAction) {
    if (!popover) {
      return
    }
    action.onSelect({ rowId: popover.rowId, minutes: popover.minutes })
    setPopover(null)
  }

  return (
    <Box
      ref={scrollRef}
      sx={{
        overflow: 'auto',
        maxHeight,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '12px',
        backgroundColor: 'background.paper',
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', width: NAME_COLUMN_WIDTH + dayWidth }}>
        <Box sx={{ display: 'flex', position: 'sticky', top: 0, zIndex: 3 }}>
          <Box
            sx={{
              width: NAME_COLUMN_WIDTH,
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
          <Box
            sx={{
              width: dayWidth,
              height: HEADER_HEIGHT,
              position: 'relative',
              bgcolor: 'background.paper',
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            {slotTicks.map((minutes) => (
              <Typography
                key={minutes}
                variant="caption"
                sx={{
                  position: 'absolute',
                  left: (minutes - originMinutes) * PX_PER_MINUTE + 4,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'text.secondary',
                }}
              >
                {minutesToLabel(minutes)}
              </Typography>
            ))}
          </Box>
        </Box>

        {rows.length === 0 && (
          <Box sx={{ p: 4 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {emptyRowsText}
            </Typography>
          </Box>
        )}

        {rows.map((row) => {
          const rowEntries = placed.filter(({ entry }) => entry.rowId === row.id)
          const isHovered = !isDragging && hover?.rowId === row.id

          return (
            <Box key={row.id} sx={{ display: 'flex' }}>
              <Box
                sx={{
                  width: NAME_COLUMN_WIDTH,
                  flexShrink: 0,
                  position: 'sticky',
                  left: 0,
                  zIndex: 2,
                  height: ROW_HEIGHT,
                  bgcolor: 'background.paper',
                  borderRight: '1px solid',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  alignItems: 'center',
                  px: 2,
                }}
              >
                <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                  {row.name}
                </Typography>
              </Box>

              <TimelineDropRow
                rowId={row.id}
                width={dayWidth}
                clickable={canAdd && isHovered}
                onMouseMove={(event) => handleMouseMove(event, row.id)}
                onMouseLeave={handleMouseLeave}
                onClick={(event) => handleClick(event, row)}
              >
                {closedSpans.map((span) => (
                  <Box
                    key={span.startMinutes}
                    aria-hidden
                    sx={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: (span.startMinutes - originMinutes) * PX_PER_MINUTE,
                      width: (span.endMinutes - span.startMinutes) * PX_PER_MINUTE,
                      bgcolor: 'action.hover',
                      pointerEvents: 'none',
                    }}
                  />
                ))}

                {rowEntries.map(({ entry, segment }) => (
                  <CalendarEntryCard
                    key={entry.id}
                    entry={entry}
                    segment={segment}
                    range={timeRange}
                    openHours={openHours}
                    labels={entryLabels}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onHoverStart={() => setHover(null)}
                    disabled={!isEntryEditable(entry)}
                    highlighted={entry.id === focusEntryId}
                  />
                ))}

                {dropPlaceholder?.rowId === row.id && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: (dropPlaceholder.minutes - originMinutes) * PX_PER_MINUTE,
                      width: Math.max(dropPlaceholder.durationMinutes * PX_PER_MINUTE, 8),
                      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.2),
                      borderLeft: '2px solid',
                      borderColor: 'primary.main',
                      pointerEvents: 'none',
                    }}
                  >
                    {/* At the bottom so it doesn't sit under the drag overlay's text. */}
                    <Typography
                      variant="caption"
                      sx={{ position: 'absolute', bottom: 0, left: 0, px: '4px', color: 'primary.dark', fontWeight: 600 }}
                    >
                      {minutesToLabel(dropPlaceholder.minutes)}
                    </Typography>
                  </Box>
                )}

                {isHovered && hover && (
                  <>
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        left: (hover.minutes - originMinutes) * PX_PER_MINUTE,
                        width: '2px',
                        bgcolor: 'primary.main',
                        pointerEvents: 'none',
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: (hover.minutes - originMinutes) * PX_PER_MINUTE,
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        transform: 'translate(-50%, -50%)',
                        pointerEvents: 'none',
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 2,
                        left: (hover.minutes - originMinutes) * PX_PER_MINUTE + 6,
                        px: '4px',
                        borderRadius: '6px',
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        pointerEvents: 'none',
                      }}
                    >
                      <Typography variant="caption" sx={{ color: 'inherit' }}>
                        {minutesToLabel(hover.minutes)}
                      </Typography>
                    </Box>
                  </>
                )}
              </TimelineDropRow>
            </Box>
          )
        })}
      </Box>

      <AddActionsPopover
        position={popover ? { top: popover.top, left: popover.left } : null}
        actions={addActions}
        onSelect={handleAddClick}
        onClose={handlePopoverClose}
      />
    </Box>
  )
}
