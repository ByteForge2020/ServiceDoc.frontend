import { useState } from 'react'
import CarRepairIcon from '@mui/icons-material/CarRepair'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import ScheduleIcon from '@mui/icons-material/Schedule'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { useShopTimeZone } from '../../../app/shop/useShopTimeZone'
import { formatScheduledRange } from '../../../utils/timeGrid'
import type { ServiceBayBookingSummary } from '../types'

interface WorkOrderBookingTileProps {
  booking: ServiceBayBookingSummary
  onEdit: (booking: ServiceBayBookingSummary) => void
  onDelete: (booking: ServiceBayBookingSummary) => void
}

/**
 * One service bay booking of a work order, with an Edit / Delete menu that appears on hover. A different accent
 * colour and a bay icon tell it apart from the job tiles.
 */
export function WorkOrderBookingTile({ booking, onEdit, onDelete }: WorkOrderBookingTileProps) {
  const { t } = useTranslation()
  const zone = useShopTimeZone()
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const menuOpen = !!menuAnchor

  return (
    <Box
      sx={{
        position: 'relative',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderLeft: '3px solid',
        borderLeftColor: 'warning.main',
        borderRadius: '8px',
        // The menu button shows on hover; touch screens have no hover, so it is always there.
        '& .booking-tile-menu': { opacity: menuOpen ? 1 : 0 },
        '&:hover .booking-tile-menu, &:focus-within .booking-tile-menu': { opacity: 1 },
        '@media (hover: none)': { '& .booking-tile-menu': { opacity: 1 } },
      }}
    >
      <IconButton
        className="booking-tile-menu"
        size="small"
        aria-label={t('serviceBayBookings.menuAria')}
        onClick={(event) => setMenuAnchor(event.currentTarget)}
        sx={{ position: 'absolute', top: 8, right: 8 }}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 4, minWidth: 0 }}>
        <CarRepairIcon sx={{ fontSize: 20, color: 'warning.main', flexShrink: 0 }} />
        <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
          {booking.serviceBayName}
        </Typography>
        {booking.isServiceBayDeleted && <Chip size="small" label={t('serviceBayBookings.deletedBay')} />}
      </Box>
      <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>
        {booking.descriptions.length > 0 ? booking.descriptions.join(', ') : t('workOrders.jobsTable.noDescription')}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
        <ScheduleIcon sx={{ fontSize: 18 }} />
        <Typography variant="body2">
          {formatScheduledRange(booking.scheduledTime, booking.scheduledDurationMinutes, zone)}
        </Typography>
      </Box>

      <Menu anchorEl={menuAnchor} open={menuOpen} onClose={() => setMenuAnchor(null)}>
        {/* A deleted bay is not in the calendar, so there is nowhere to edit the booking: only deleting is offered. */}
        <MenuItem
          disabled={booking.isServiceBayDeleted}
          onClick={() => {
            setMenuAnchor(null)
            onEdit(booking)
          }}
        >
          {t('serviceBayBookings.edit')}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setMenuAnchor(null)
            onDelete(booking)
          }}
          sx={{ color: 'error.main' }}
        >
          {t('serviceBayBookings.delete')}
        </MenuItem>
      </Menu>
    </Box>
  )
}
