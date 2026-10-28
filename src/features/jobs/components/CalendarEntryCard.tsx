import { useState, type MouseEvent as ReactMouseEvent } from 'react'
import { useDraggable } from '@dnd-kit/core'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import { alpha, keyframes } from '@mui/material/styles'
import { useShopTimeZone } from '../../../app/shop/useShopTimeZone'
import type { CalendarEntry } from '../types'
import { ENTRY_CARD_ATTRIBUTE, ENTRY_ID_ATTRIBUTE } from '../technicianUtils'
import { PX_PER_MINUTE } from '../gridConstants'
import { formatTimeRange, utcIsoToMinutesOfDay } from '../../../utils/timeGrid'

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
  labels: EntryLabels
  onEdit: (entry: CalendarEntry) => void
  onDelete: (entry: CalendarEntry) => void
  onHoverStart?: () => void
  /** Locked: shown dimmed, with no menu and no dragging. */
  disabled?: boolean
  /** Pulses briefly to point out the entry the calendar was opened for. */
  highlighted?: boolean
}

/** The entry's descriptions on one line, or null when it has none. */
function descriptionsText(entry: CalendarEntry): string | null {
  return entry.descriptions.length > 0 ? entry.descriptions.map((description) => description.name).join(', ') : null
}

export function CalendarEntryCard({
  entry,
  labels,
  onEdit,
  onDelete,
  onHoverStart,
  disabled = false,
  highlighted = false,
}: CalendarEntryCardProps) {
  const zone = useShopTimeZone()
  const [hovered, setHovered] = useState(false)
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const menuOpen = !!menuAnchor

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: entry.id,
    data: { entry },
    disabled,
  })

  const text = descriptionsText(entry)
  const startMinutes = utcIsoToMinutesOfDay(entry.scheduledTime, zone)
  const left = startMinutes * PX_PER_MINUTE
  const width = Math.max(entry.scheduledDurationMinutes * PX_PER_MINUTE, 8)

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
      sx={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        left,
        width,
        borderRadius: '6px',
        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
        border: '1px solid',
        borderColor: 'primary.light',
        overflow: 'hidden',
        px: 1,
        py: '2px',
        cursor: disabled ? 'default' : 'grab',
        touchAction: disabled ? 'auto' : 'none',
        // The DragOverlay shows the moving copy; the original stays in place, faded, until the drop.
        opacity: isDragging ? 0.35 : disabled ? 0.5 : 1,
        '--pulse-color': (theme) => alpha(theme.palette.primary.main, 0.6),
        animation: highlighted ? `${pulse} 900ms ease-out 3` : 'none',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '2px' }}>
        <Typography variant="body2" noWrap sx={{ fontWeight: 600, color: 'primary.dark' }}>
          #{entry.orderNumber}
        </Typography>
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
        {text ?? formatTimeRange(entry.scheduledTime, entry.scheduledDurationMinutes, zone)}
      </Typography>

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
export function CalendarEntryCardPreview({ entry }: { entry: CalendarEntry }) {
  const zone = useShopTimeZone()
  const text = descriptionsText(entry)

  return (
    <Box
      sx={{
        height: '100%',
        borderRadius: '6px',
        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.3),
        border: '1px solid',
        borderColor: 'primary.main',
        boxShadow: 4,
        overflow: 'hidden',
        px: 1,
        py: '2px',
        cursor: 'grabbing',
      }}
    >
      <Typography variant="body2" noWrap sx={{ fontWeight: 600, color: 'primary.dark' }}>
        #{entry.orderNumber}
      </Typography>
      <Typography variant="caption" noWrap component="div">
        {text ?? formatTimeRange(entry.scheduledTime, entry.scheduledDurationMinutes, zone)}
      </Typography>
    </Box>
  )
}
