import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react'
import { useDndContext, useDroppable } from '@dnd-kit/core'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Popover from '@mui/material/Popover'
import Typography from '@mui/material/Typography'
import { alpha } from '@mui/material/styles'
import {
  DAY_WIDTH_PX,
  HEADER_HEIGHT,
  INITIAL_SCROLL_HOUR,
  MINUTES_PER_DAY,
  NAME_COLUMN_WIDTH,
  PX_PER_MINUTE,
  ROW_HEIGHT,
  SLOT_MINUTES,
  SNAP_MINUTES,
} from '../gridConstants'
import type { CalendarEntry, CalendarRow } from '../types'
import { ENTRY_ID_ATTRIBUTE, TIMELINE_ATTRIBUTE } from '../technicianUtils'
import { minutesToLabel, offsetXToMinutes, snapMinutes } from '../../../utils/timeGrid'
import { CalendarEntryCard, type EntryLabels } from './CalendarEntryCard'

interface HoverState {
  rowId: string
  minutes: number
}

interface PopoverState {
  rowId: string
  rowName: string
  minutes: number
  top: number
  left: number
}

export interface DropPlaceholder {
  rowId: string
  minutes: number
  durationMinutes: number
}

interface ResourceGridProps {
  rows: CalendarRow[]
  entries: CalendarEntry[]
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
  /** Label of the button offered when an empty slot is clicked. */
  addLabel: string
  entryLabels: EntryLabels
  onAdd: (params: { rowId: string; rowName: string; minutes: number }) => void
  onEdit: (entry: CalendarEntry) => void
  onDelete: (entry: CalendarEntry) => void
}

const slotTicks = Array.from({ length: MINUTES_PER_DAY / SLOT_MINUTES }, (_, i) => i * SLOT_MINUTES)

interface TimelineDropRowProps {
  rowId: string
  clickable: boolean
  children: ReactNode
  onMouseMove: (event: ReactMouseEvent<HTMLDivElement>) => void
  onMouseLeave: () => void
  onClick: (event: ReactMouseEvent<HTMLDivElement>) => void
}

function TimelineDropRow({ rowId, clickable, children, onMouseMove, onMouseLeave, onClick }: TimelineDropRowProps) {
  const { setNodeRef } = useDroppable({ id: rowId })

  return (
    <Box
      ref={setNodeRef}
      {...{ [TIMELINE_ATTRIBUTE]: rowId }}
      sx={{
        width: DAY_WIDTH_PX,
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
  entries,
  dropPlaceholder,
  isEntryEditable,
  canAdd,
  focusEntryId,
  maxHeight = 'calc(100vh - 260px)',
  emptyRowsText,
  addLabel,
  entryLabels,
  onAdd,
  onEdit,
  onDelete,
}: ResourceGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
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
      container.scrollLeft = INITIAL_SCROLL_HOUR * 60 * PX_PER_MINUTE
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

  function handleMouseMove(event: ReactMouseEvent<HTMLDivElement>, rowId: string) {
    if (!canAdd) {
      return
    }

    const rect = event.currentTarget.getBoundingClientRect()
    const offsetX = event.clientX - rect.left
    const minutes = snapMinutes(offsetXToMinutes(offsetX, PX_PER_MINUTE), SNAP_MINUTES, MINUTES_PER_DAY)
    setHover({ rowId, minutes })
  }

  function handleMouseLeave() {
    setHover(null)
  }

  function handleClick(event: ReactMouseEvent<HTMLDivElement>, row: CalendarRow) {
    if (!canAdd) {
      return
    }

    const rect = event.currentTarget.getBoundingClientRect()
    const offsetX = event.clientX - rect.left
    const minutes = snapMinutes(offsetXToMinutes(offsetX, PX_PER_MINUTE), SNAP_MINUTES, MINUTES_PER_DAY)
    setPopover({
      rowId: row.id,
      rowName: row.name,
      minutes,
      top: event.clientY,
      left: event.clientX,
    })
  }

  function handlePopoverClose() {
    setPopover(null)
  }

  function handleAddClick() {
    if (!popover) {
      return
    }
    onAdd({ rowId: popover.rowId, rowName: popover.rowName, minutes: popover.minutes })
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
      <Box sx={{ display: 'flex', flexDirection: 'column', width: NAME_COLUMN_WIDTH + DAY_WIDTH_PX }}>
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
              width: DAY_WIDTH_PX,
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
                  left: minutes * PX_PER_MINUTE + 4,
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
          const rowEntries = entries.filter((entry) => entry.rowId === row.id)
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
                clickable={canAdd}
                onMouseMove={(event) => handleMouseMove(event, row.id)}
                onMouseLeave={handleMouseLeave}
                onClick={(event) => handleClick(event, row)}
              >
                {rowEntries.map((entry) => (
                  <CalendarEntryCard
                    key={entry.id}
                    entry={entry}
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
                      left: dropPlaceholder.minutes * PX_PER_MINUTE,
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
                        left: hover.minutes * PX_PER_MINUTE,
                        width: '2px',
                        bgcolor: 'primary.main',
                        pointerEvents: 'none',
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: hover.minutes * PX_PER_MINUTE,
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
                        left: hover.minutes * PX_PER_MINUTE + 6,
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

      <Popover
        open={!!popover}
        onClose={handlePopoverClose}
        anchorReference="anchorPosition"
        anchorPosition={popover ? { top: popover.top, left: popover.left } : undefined}
      >
        <Button variant="text" onClick={handleAddClick} sx={{ m: 1 }}>
          {addLabel}
        </Button>
      </Popover>
    </Box>
  )
}
