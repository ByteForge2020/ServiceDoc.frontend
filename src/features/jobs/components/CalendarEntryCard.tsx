import { useState, type MouseEvent as ReactMouseEvent } from 'react'
import { useDraggable } from '@dnd-kit/core'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import { alpha, keyframes } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import type { CalendarEntry } from '../types'
import { ENTRY_CARD_ATTRIBUTE, ENTRY_ID_ATTRIBUTE, entryPalette } from '../technicianUtils'
import { isMultiPiece, visiblePart, type EntrySegment } from '../entrySegments'
import { PX_PER_MINUTE } from '../gridConstants'
import type { TimeRange } from '../workingHours'

// A short ring pulse that draws the eye to the entry being edited when the calendar opens.
const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 var(--pulse-color); }
  100% { box-shadow: 0 0 0 10px transparent; }
`

/** Texts that differ between the calendars (jobs / service bay bookings). */
export interface EntryLabels {
  menuAria: string
  edit: string
  delete: string
}

interface CalendarEntryCardProps {
  entry: CalendarEntry
  /** The part of the entry on the day shown. */
  segment: EntrySegment
  /** The stretch of the day the timeline draws; the card is positioned in it and cut at its edges. */
  range: TimeRange
  /** The working hours the part is cut to (null: not cut, e.g. a day off). */
  openHours: TimeRange | null
  labels: EntryLabels
  onEdit: (entry: CalendarEntry) => void
  onDelete: (entry: CalendarEntry) => void
  onHoverStart?: () => void
  /** Locked: shown dimmed, with no menu and no dragging. */
  disabled?: boolean
  /** Pulses briefly to point out the entry the calendar was opened for. */
  highlighted?: boolean
}

/** "#123" for a work order's entry, "Appointment 45" (with an icon) for an appointment's. */
export function EntryTitle({ entry }: { entry: CalendarEntry }) {
  const { t } = useTranslation()
  const palette = entryPalette(entry)

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0 }}>
      {entry.kind === 'appointment' && <CalendarMonthIcon sx={{ fontSize: 14, color: `${palette}.dark`, flexShrink: 0 }} />}
      <Typography variant="body2" noWrap sx={{ fontWeight: 600, color: `${palette}.dark` }}>
        {entry.kind === 'appointment' ? t('jobs.entry.appointmentTitle', { number: entry.parentNumber }) : `#${entry.parentNumber}`}
      </Typography>
    </Box>
  )
}

/** An arrow at a card's edge: the entry goes on past it (into the next or from the previous day, or the cut-off time). */
function ContinuationArrow({ side, palette }: { side: 'left' | 'right'; palette: 'primary' | 'appointment' }) {
  const Icon = side === 'left' ? ChevronLeftIcon : ChevronRightIcon

  return (
    <Icon
      aria-hidden
      sx={{
        position: 'absolute',
        top: '50%',
        [side]: 2,
        transform: 'translateY(-50%)',
        fontSize: 18,
        color: `${palette}.dark`,
        pointerEvents: 'none',
      }}
    />
  )
}

/** The entry's descriptions on one line, or null when it has none. */
function descriptionsText(entry: CalendarEntry): string | null {
  return entry.descriptions.length > 0 ? entry.descriptions.map((description) => description.name).join(', ') : null
}

export function CalendarEntryCard({
  entry,
  segment,
  range,
  openHours,
  labels,
  onEdit,
  onDelete,
  onHoverStart,
  disabled = false,
  highlighted = false,
}: CalendarEntryCardProps) {
  const { t } = useTranslation()
  const [hovered, setHovered] = useState(false)
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const menuOpen = !!menuAnchor

  // An entry drawn in several pieces can't be dragged: its time is changed in its form.
  const dragLocked = isMultiPiece(segment)

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: entry.id,
    data: { entry, segment },
    disabled: disabled || dragLocked,
  })

  const part = visiblePart(segment, range, openHours)
  if (!part) {
    return null
  }

  const text = descriptionsText(entry)
  const palette = entryPalette(entry)
  const left = (part.startMinutes - range.startMinutes) * PX_PER_MINUTE
  const width = Math.max((part.endMinutes - part.startMinutes) * PX_PER_MINUTE, 8)

  function handleMenuOpen(event: ReactMouseEvent<HTMLElement>) {
    event.stopPropagation()
    setMenuAnchor(event.currentTarget)
  }

  function handleMenuClose() {
    setMenuAnchor(null)
  }

  function handleEditClick(event: ReactMouseEvent<HTMLElement>) {
    event.stopPropagation()
    setMenuAnchor(null)
    onEdit(entry)
  }

  function handleDeleteClick(event: ReactMouseEvent<HTMLElement>) {
    event.stopPropagation()
    setMenuAnchor(null)
    onDelete(entry)
  }

  return (
    <Box
      ref={setNodeRef}
      {...{ [ENTRY_CARD_ATTRIBUTE]: '', [ENTRY_ID_ATTRIBUTE]: entry.id }}
      {...attributes}
      {...listeners}
      onMouseEnter={() => {
        setHovered(true)
        onHoverStart?.()
      }}
      onMouseLeave={() => setHovered(false)}
      onMouseMove={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      title={dragLocked ? t('jobs.entry.multiDayHint') : undefined}
      sx={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        left,
        width,
        borderRadius: '6px',
        ...(part.cutBefore && { borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }),
        ...(part.cutAfter && { borderTopRightRadius: 0, borderBottomRightRadius: 0 }),
        bgcolor: (theme) => alpha(theme.palette[palette].main, entry.kind === 'appointment' ? 0.08 : 0.12),
        borderWidth: '1px',
        borderStyle: entry.kind === 'appointment' ? 'dashed' : 'solid',
        borderColor: `${palette}.light`,
        overflow: 'hidden',
        px: 1,
        py: '2px',
        // Room for the arrows that show the entry goes on.
        ...(part.cutBefore && { pl: '20px' }),
        ...(part.cutAfter && { pr: '20px' }),
        cursor: disabled || dragLocked ? 'default' : 'grab',
        touchAction: disabled || dragLocked ? 'auto' : 'none',
        // The DragOverlay shows the moving copy; the original stays in place, faded, until the drop.
        opacity: isDragging ? 0.35 : disabled ? 0.5 : 1,
        '--pulse-color': (theme) => alpha(theme.palette[palette].main, 0.6),
        animation: highlighted ? `${pulse} 900ms ease-out 3` : 'none',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '2px' }}>
        <EntryTitle entry={entry} />
        {!disabled && (
          <IconButton
            size="small"
            aria-label={labels.menuAria}
            onClick={handleMenuOpen}
            sx={{ p: '2px', flexShrink: 0, opacity: hovered || menuOpen ? 1 : 0 }}
          >
            <MoreVertIcon fontSize="inherit" />
          </IconButton>
        )}
      </Box>
      <Typography variant="caption" noWrap component="div" title={text ?? undefined}>
        {text ?? segment.rangeLabel}
      </Typography>

      {part.cutBefore && <ContinuationArrow side="left" palette={palette} />}
      {part.cutAfter && <ContinuationArrow side="right" palette={palette} />}

      {/* The menu is portaled, but React still bubbles its pointer events up to the draggable card. */}
      <Menu anchorEl={menuAnchor} open={menuOpen} onClose={handleMenuClose} onPointerDown={(event) => event.stopPropagation()}>
        <MenuItem onClick={handleEditClick}>{labels.edit}</MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          {labels.delete}
        </MenuItem>
      </Menu>
    </Box>
  )
}

/** The copy of an entry card that follows the pointer while dragging; sized by DragOverlay to match the original. */
export function CalendarEntryCardPreview({ entry, rangeLabel }: { entry: CalendarEntry; rangeLabel: string }) {
  const text = descriptionsText(entry)
  const palette = entryPalette(entry)

  return (
    <Box
      sx={{
        height: '100%',
        borderRadius: '6px',
        bgcolor: (theme) => alpha(theme.palette[palette].main, 0.3),
        borderWidth: '1px',
        borderStyle: entry.kind === 'appointment' ? 'dashed' : 'solid',
        borderColor: `${palette}.main`,
        boxShadow: 4,
        overflow: 'hidden',
        px: 1,
        py: '2px',
        cursor: 'grabbing',
      }}
    >
      <EntryTitle entry={entry} />
      <Typography variant="caption" noWrap component="div">
        {text ?? rangeLabel}
      </Typography>
    </Box>
  )
}
