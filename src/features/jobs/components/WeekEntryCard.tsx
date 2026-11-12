import { useState, type MouseEvent as ReactMouseEvent } from 'react'
import { useDraggable } from '@dnd-kit/core'
import CarRepairIcon from '@mui/icons-material/CarRepair'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { alpha } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import { CARD_GAP, SLOT_GUTTER_WIDTH } from '../../appointments/gridConstants'
import { isMultiPiece, type EntrySegment } from '../entrySegments'
import { entryPalette } from '../technicianUtils'
import type { CalendarEntry } from '../types'
import type { EntryLabels } from './CalendarEntryCard'

/** What an entry's row stands for: it decides the icon in front of the name. */
export type ResourceKind = 'technician' | 'serviceBay'

interface WeekEntryCardProps {
  entry: CalendarEntry
  /** The part of the entry on the day of this card, and that day (an entry can have a card on several days). */
  segment: EntrySegment
  dateIso: string
  /** The entry goes on above / below the card: from the previous day or the cut-off time, into the next day or beyond. */
  cutBefore: boolean
  cutAfter: boolean
  resourceKind: ResourceKind
  labels: EntryLabels
  top: number
  height: number
  /** The card's column among the entries that overlap it in time, and how many columns they share. */
  column: number
  columnCount: number
  onEdit: (entry: CalendarEntry) => void
  onDelete: (entry: CalendarEntry) => void
}

function ContinuationArrow({ side, palette }: { side: 'top' | 'bottom'; palette: 'primary' | 'appointment' }) {
  const Icon = side === 'top' ? KeyboardArrowUpIcon : KeyboardArrowDownIcon

  return (
    <Icon
      aria-hidden
      sx={{
        position: 'absolute',
        left: '50%',
        [side]: 0,
        transform: 'translateX(-50%)',
        fontSize: 16,
        color: `${palette}.dark`,
        pointerEvents: 'none',
      }}
    />
  )
}

/** "#123" for a work order's entry, "Appointment 45" for an appointment's. */
function useParentLabel(entry: CalendarEntry): string {
  const { t } = useTranslation()
  return entry.kind === 'appointment' ? t('jobs.entry.appointmentTitle', { number: entry.parentNumber }) : `#${entry.parentNumber}`
}

/** An entry of the week view: a card positioned by its start time and duration along the day column. */
export function WeekEntryCard({
  entry,
  segment,
  dateIso,
  cutBefore,
  cutAfter,
  resourceKind,
  labels,
  top,
  height,
  column,
  columnCount,
  onEdit,
  onDelete,
}: WeekEntryCardProps) {
  const { t } = useTranslation()
  const parentLabel = useParentLabel(entry)
  const dragLocked = isMultiPiece(segment)
  const [hovered, setHovered] = useState(false)
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const menuOpen = !!menuAnchor

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${entry.id}:${dateIso}`,
    data: { entry, segment, dateIso },
    // An entry drawn in several pieces can't be dragged: its time is changed in its form.
    disabled: dragLocked,
  })

  const palette = entryPalette(entry)
  const Icon = resourceKind === 'serviceBay' ? CarRepairIcon : PersonOutlinedIcon
  const descriptions = entry.descriptions.map((description) => description.name).join(', ')
  // The day's width minus the free gutter is shared equally by the entries that overlap in time.
  const columnWidth = `((100% - ${CARD_GAP}px - ${SLOT_GUTTER_WIDTH}px) / ${columnCount})`

  function handleMenuOpen(event: ReactMouseEvent<HTMLElement>) {
    event.stopPropagation()
    setMenuAnchor(event.currentTarget)
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

  const tooltip = (
    <Stack spacing="2px">
      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
        {segment.rangeLabel}
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.primary' }}>
        {entry.rowName}
      </Typography>
      <Typography variant="caption">{parentLabel}</Typography>
      {descriptions && <Typography variant="caption">{descriptions}</Typography>}
      {dragLocked && <Typography variant="caption">{t('jobs.entry.multiDayHint')}</Typography>}
    </Stack>
  )

  return (
    // No tooltip while the entry is being dragged: the overlay shows it instead.
    <Tooltip
      title={isDragging || menuOpen ? '' : tooltip}
      enterDelay={500}
      // Above the card, so it doesn't cover the neighbouring entries that share the column.
      placement="top-start"
      slotProps={{
        tooltip: {
          // A light card like the other popups, instead of the default translucent dark one (grey text vanished on it).
          sx: {
            maxWidth: 280,
            px: 1.5,
            py: 1,
            bgcolor: 'background.paper',
            color: 'text.primary',
            border: 1,
            borderColor: 'divider',
            borderRadius: '8px',
            boxShadow: 3,
          },
        },
      }}
    >
      <Box
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onMouseMove={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
        sx={{
          position: 'absolute',
          top,
          left: `calc(${CARD_GAP}px + ${columnWidth} * ${column})`,
          width: `calc(${columnWidth} - ${CARD_GAP}px)`,
          height,
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '6px',
          ...(cutBefore && { borderTopLeftRadius: 0, borderTopRightRadius: 0 }),
          ...(cutAfter && { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }),
          borderWidth: '1px',
          borderStyle: entry.kind === 'appointment' ? 'dashed' : 'solid',
          borderColor: `${palette}.light`,
          bgcolor: (theme) =>
            // Opaque enough to hide the grid lines under it, like the cards of the other calendars.
            alpha(theme.palette[palette].main, entry.kind === 'appointment' ? 0.12 : 0.16),
          overflow: 'hidden',
          px: 1,
          py: '2px',
          cursor: dragLocked ? 'default' : 'grab',
          touchAction: dragLocked ? 'auto' : 'none',
          // The DragOverlay shows the moving copy; the original stays in place, faded, until the drop.
          opacity: isDragging ? 0.35 : 1,
          '&:hover': { zIndex: 2, boxShadow: 3 },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '2px', minWidth: 0 }}>
          <Stack direction="row" spacing="4px" sx={{ alignItems: 'center', minWidth: 0 }}>
            <Icon sx={{ fontSize: 14, color: `${palette}.dark`, flexShrink: 0 }} />
            <Typography variant="body2" noWrap sx={{ fontWeight: 600, color: `${palette}.dark` }}>
              {entry.rowName}
            </Typography>
          </Stack>
          <IconButton
            size="small"
            aria-label={labels.menuAria}
            onClick={handleMenuOpen}
            sx={{ p: '2px', flexShrink: 0, opacity: hovered || menuOpen ? 1 : 0 }}
          >
            <MoreVertIcon fontSize="inherit" />
          </IconButton>
        </Box>
        <Typography variant="caption" noWrap component="div">
          {parentLabel}
        </Typography>
        {descriptions && (
          <Typography variant="caption" noWrap component="div" sx={{ color: 'text.secondary' }}>
            {descriptions}
          </Typography>
        )}

        {/* The entry goes on past this card's edge: into the cut-off time or the neighbouring day. */}
        {cutBefore && <ContinuationArrow side="top" palette={palette} />}
        {cutAfter && <ContinuationArrow side="bottom" palette={palette} />}

        {/* The menu is portaled, but React still bubbles its pointer events up to the draggable card. */}
        <Menu
          anchorEl={menuAnchor}
          open={menuOpen}
          onClose={() => setMenuAnchor(null)}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <MenuItem onClick={handleEditClick}>{labels.edit}</MenuItem>
          <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
            {labels.delete}
          </MenuItem>
        </Menu>
      </Box>
    </Tooltip>
  )
}
