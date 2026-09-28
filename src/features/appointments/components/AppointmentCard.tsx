import { useState, type MouseEvent as ReactMouseEvent } from 'react'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import { useTranslation } from 'react-i18next'
import { useShopTimeZone } from '../../../app/shop/useShopTimeZone'
import { utcIsoToMinutesOfDay } from '../../../utils/timeGrid'
import { APPOINTMENT_STATUS_COLOR } from '../appointmentStatus'
import type { Appointment } from '../types'

const STATUS_BAR_HEIGHT = 4
const MIN_CARD_HEIGHT = 32

interface AppointmentCardProps {
  appointment: Appointment
  pxPerMinute: number
  scaleStartMinutes: number
  onOpenDetails: (appointment: Appointment) => void
  onEdit: (appointment: Appointment) => void
  onDelete: (appointment: Appointment) => void
}

export function AppointmentCard({
  appointment,
  pxPerMinute,
  scaleStartMinutes,
  onOpenDetails,
  onEdit,
  onDelete,
}: AppointmentCardProps) {
  const { t } = useTranslation()
  const zone = useShopTimeZone()
  const [hovered, setHovered] = useState(false)
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const menuOpen = !!menuAnchor
  const isConverted = !!appointment.convertedWorkOrderId

  const startMinutes = utcIsoToMinutesOfDay(appointment.scheduledTime, zone)
  const top = (startMinutes - scaleStartMinutes) * pxPerMinute
  const height = Math.max(appointment.durationMinutes * pxPerMinute, MIN_CARD_HEIGHT)

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
    onEdit(appointment)
  }

  function handleDeleteClick(event: ReactMouseEvent<HTMLElement>) {
    event.stopPropagation()
    setMenuAnchor(null)
    onDelete(appointment)
  }

  const customerLabel = appointment.customerName?.trim() || t('appointmentsPage.card.noCustomer')
  const vehicleLabel = appointment.vehicleDescription ?? null
  const reasonsLabel = appointment.reasons.map((reason) => reason.name).join(', ')

  return (
    <Box
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={(event) => {
        event.stopPropagation()
        onOpenDetails(appointment)
      }}
      sx={{
        position: 'absolute',
        top,
        left: 4,
        right: 4,
        height,
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '6px',
        border: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        boxShadow: '0 1px 3px rgba(15,23,42,0.12)',
        overflow: 'hidden',
        cursor: 'pointer',
      }}
    >
      <Box sx={{ height: STATUS_BAR_HEIGHT, flexShrink: 0, bgcolor: `${APPOINTMENT_STATUS_COLOR[appointment.status]}.main` }} />

      <Box sx={{ px: 1, py: '4px', overflow: 'hidden', flex: 1, minHeight: 0 }}>
        <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: '2px' }}>
          <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
            {customerLabel}
          </Typography>
          {!isConverted && (
            <IconButton
              size="small"
              aria-label={t('appointmentsPage.card.menuAria')}
              onClick={handleMenuOpen}
              sx={{ p: '2px', flexShrink: 0, opacity: hovered || menuOpen ? 1 : 0 }}
            >
              <MoreVertIcon fontSize="inherit" />
            </IconButton>
          )}
        </Stack>

        {vehicleLabel && (
          <Typography variant="caption" noWrap component="div" sx={{ color: 'text.secondary' }}>
            {vehicleLabel}
          </Typography>
        )}

        <Typography variant="caption" noWrap component="div" sx={{ color: 'text.secondary' }}>
          {reasonsLabel}
        </Typography>
      </Box>

      {!isConverted && (
        <Menu anchorEl={menuAnchor} open={menuOpen} onClose={handleMenuClose}>
          <MenuItem onClick={handleEditClick}>{t('appointmentsPage.card.editAppointment')}</MenuItem>
          <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
            {t('appointmentsPage.card.deleteAppointment')}
          </MenuItem>
        </Menu>
      )}
    </Box>
  )
}
