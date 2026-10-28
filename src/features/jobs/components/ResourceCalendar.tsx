import { useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { useTheme } from '@mui/material/styles'
import { DateTime } from 'luxon'
import { useTranslation } from 'react-i18next'
import { useShopTimeZone } from '../../../app/shop/useShopTimeZone'
import { MINUTES_PER_DAY, PX_PER_MINUTE, SNAP_MINUTES } from '../gridConstants'
import { ENTRY_CARD_ATTRIBUTE, TIMELINE_ATTRIBUTE } from '../technicianUtils'
import { useDragEdgeNavigation } from '../useDragEdgeNavigation'
import { localDateAndMinutesToUtcIso, offsetXToMinutes, snapMinutes } from '../../../utils/timeGrid'
import type { CalendarEntry, CalendarMode, CalendarRow } from '../types'
import { CalendarEntryCardPreview, type EntryLabels } from './CalendarEntryCard'
import { EdgeIndicator } from './EdgeIndicator'
import { ResourceGrid } from './ResourceGrid'

interface DropTarget {
  rowId: string
  minutes: number
}

export interface ResourceCalendarProps {
  rows: CalendarRow[]
  entries: CalendarEntry[]
  selectedDate: string
  /** Called when a dragged entry rests at a screen edge: moves the calendar one day back (-1) or forward (1). */
  onShiftDate: (direction: -1 | 1) => void
  mode: CalendarMode
  /** Height the grid may grow to before it scrolls; defaults to a full page. */
  maxHeight?: string
  emptyRowsText: ReactNode
  addLabel: string
  entryLabels: EntryLabels
  onAdd: (params: { rowId: string; rowName: string; minutes: number }) => void
  onEdit: (entry: CalendarEntry) => void
  onDelete: (entry: CalendarEntry) => void
  /** An entry was dropped on another time and/or row. */
  onMove: (params: { entry: CalendarEntry; rowId: string; rowName: string; scheduledTime: string }) => void
}

/**
 * A day calendar with drag-and-drop between rows and times: the grid, a placeholder showing where a dropped entry
 * lands, and day changes when the pointer rests at a screen edge. It holds no data of its own: the technicians and
 * service bays calendars feed it rows and entries and react to add / edit / delete / move.
 */
export function ResourceCalendar({
  rows,
  entries,
  selectedDate,
  onShiftDate,
  mode,
  maxHeight,
  emptyRowsText,
  addLabel,
  entryLabels,
  onAdd,
  onEdit,
  onDelete,
  onMove,
}: ResourceCalendarProps) {
  const { i18n } = useTranslation()
  const zone = useShopTimeZone()
  const theme = useTheme()
  const [draggedEntry, setDraggedEntry] = useState<CalendarEntry | null>(null)
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null)
  const grabOffsetXRef = useRef(0)
  const overIdRef = useRef<string | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const { pointerXRef, edge } = useDragEdgeNavigation(draggedEntry !== null, onShiftDate, (pointerX) =>
    updateDropTarget(overIdRef.current, pointerX),
  )

  function isEntryEditable(entry: CalendarEntry): boolean {
    switch (mode.kind) {
      case 'free':
        return true
      case 'addToOrder':
        return false
      case 'editEntry':
        return entry.id === mode.entryId
    }
  }

  // The card's left edge follows the pointer (minus where it was grabbed), so that edge decides the start time.
  // The row is measured from the DOM now rather than from dnd-kit's cached rects, so scrolling can't skew it.
  function resolveDropTarget(overId: string | null, pointerX: number): DropTarget | null {
    const timeline = overId && document.querySelector(`[${TIMELINE_ATTRIBUTE}="${CSS.escape(overId)}"]`)
    if (!overId || !timeline) {
      return null
    }

    const cardLeft = pointerX - grabOffsetXRef.current
    const minutes = snapMinutes(
      offsetXToMinutes(cardLeft - timeline.getBoundingClientRect().left, PX_PER_MINUTE),
      SNAP_MINUTES,
      MINUTES_PER_DAY,
    )
    return { rowId: overId, minutes }
  }

  function updateDropTarget(overId: string | null, pointerX: number) {
    const next = resolveDropTarget(overId, pointerX)
    setDropTarget((previous) =>
      previous?.rowId === next?.rowId && previous?.minutes === next?.minutes ? previous : next,
    )
  }

  function adjacentDayLabel(offsetDays: number): string {
    return DateTime.fromISO(selectedDate, { zone: 'utc' })
      .plus({ days: offsetDays })
      .setLocale(i18n.language)
      .toFormat('ccc, d LLL')
  }

  function finishDrag() {
    overIdRef.current = null
    setDraggedEntry(null)
    setDropTarget(null)
  }

  function handleDragStart({ active, activatorEvent }: DragStartEvent) {
    const entry = active.data.current?.entry as CalendarEntry | undefined
    if (!entry) {
      return
    }
    const startPointerX = activatorEvent instanceof PointerEvent ? activatorEvent.clientX : 0
    const card = activatorEvent.target instanceof Element ? activatorEvent.target.closest(`[${ENTRY_CARD_ATTRIBUTE}]`) : null
    const cardLeft = card?.getBoundingClientRect().left ?? active.rect.current.initial?.left ?? startPointerX
    pointerXRef.current = startPointerX
    grabOffsetXRef.current = startPointerX - cardLeft
    setDraggedEntry(entry)
  }

  function handleDragOver({ over }: DragOverEvent) {
    overIdRef.current = over ? String(over.id) : null
    updateDropTarget(overIdRef.current, pointerXRef.current)
  }

  function handleDragEnd({ over }: DragEndEvent) {
    const entry = draggedEntry
    finishDrag()

    const target = resolveDropTarget(over ? String(over.id) : null, pointerXRef.current)
    const row = rows.find((item) => item.id === target?.rowId)
    if (!entry || !target || !row) {
      return
    }

    const scheduledTime = localDateAndMinutesToUtcIso(selectedDate, target.minutes, zone)

    const isUnchanged =
      entry.rowId === row.id &&
      DateTime.fromISO(entry.scheduledTime).toMillis() === DateTime.fromISO(scheduledTime).toMillis()
    if (isUnchanged) {
      return
    }

    onMove({ entry, rowId: row.id, rowName: row.name, scheduledTime })
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        // The screen edges change the date instead, so only the grid's vertical scroll follows the pointer.
        autoScroll={{ threshold: { x: 0, y: 0.2 } }}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={finishDrag}
      >
        <ResourceGrid
          rows={rows}
          entries={entries}
          dropPlaceholder={
            draggedEntry && dropTarget
              ? { ...dropTarget, durationMinutes: draggedEntry.scheduledDurationMinutes }
              : null
          }
          isEntryEditable={isEntryEditable}
          canAdd={mode.kind !== 'editEntry'}
          focusEntryId={mode.kind === 'editEntry' ? mode.entryId : undefined}
          maxHeight={maxHeight}
          emptyRowsText={emptyRowsText}
          addLabel={addLabel}
          entryLabels={entryLabels}
          onAdd={onAdd}
          onEdit={onEdit}
          onDelete={onDelete}
        />

        {/* Portaled and raised so it also shows above a dialog when the calendar is opened in one. */}
        {createPortal(
          <DragOverlay dropAnimation={null} zIndex={theme.zIndex.modal + 100}>
            {draggedEntry && <CalendarEntryCardPreview entry={draggedEntry} />}
          </DragOverlay>,
          document.body,
        )}
      </DndContext>

      {draggedEntry &&
        createPortal(
          <>
            <EdgeIndicator side="left" active={edge === -1} label={adjacentDayLabel(-1)} />
            <EdgeIndicator side="right" active={edge === 1} label={adjacentDayLabel(1)} />
          </>,
          document.body,
        )}
    </>
  )
}
