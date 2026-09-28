import { useMemo } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { DateTime } from 'luxon'
import { useTranslation } from 'react-i18next'
import type { AppointmentSettings } from '../../../api/appointmentSettingsApi'
import { useShopTimeZone } from '../../../app/shop/useShopTimeZone'
import { minutesToLabel } from '../../../utils/timeGrid'
import { DAY_COLUMN_MIN_WIDTH, HEADER_HEIGHT, SLOT_HEIGHT_PX, TIME_COLUMN_WIDTH, WEEKDAY_ORDER } from '../gridConstants'
import type { Appointment } from '../types'
import { weekDates } from '../weekUtils'
import { AppointmentCard } from './AppointmentCard'

const DAY_LABEL_KEYS: Record<number, string> = {
  0: 'appointments.days.sunday',
  1: 'appointments.days.monday',
  2: 'appointments.days.tuesday',
  3: 'appointments.days.wednesday',
  4: 'appointments.days.thursday',
  5: 'appointments.days.friday',
  6: 'appointments.days.saturday',
}

const FALLBACK_OPENING_MINUTES = 8 * 60
const FALLBACK_CLOSING_MINUTES = 18 * 60

interface AppointmentsWeekGridProps {
  weekStart: string
  settings: AppointmentSettings
  appointments: Appointment[]
  onScheduleSlot: (dateIso: string, minutes: number) => void
  onOpenDetails: (appointment: Appointment) => void
  onEditAppointment: (appointment: Appointment) => void
  onDeleteAppointment: (appointment: Appointment) => void
}

export function AppointmentsWeekGrid({
  weekStart,
  settings,
  appointments,
  onScheduleSlot,
  onOpenDetails,
  onEditAppointment,
  onDeleteAppointment,
}: AppointmentsWeekGridProps) {
  const { t } = useTranslation()
  const zone = useShopTimeZone()

  const slotMinutes = settings.defaultAppointmentDurationMinutes
  const pxPerMinute = SLOT_HEIGHT_PX / slotMinutes

  const scheduleByDay = useMemo(() => new Map(settings.schedule.map((day) => [day.dayOfWeek, day])), [settings.schedule])

  const { scaleStartMinutes, scaleEndMinutes } = useMemo(() => {
    const enabledDays = settings.schedule.filter((day) => day.isEnabled)
    if (enabledDays.length === 0) {
      return { scaleStartMinutes: FALLBACK_OPENING_MINUTES, scaleEndMinutes: FALLBACK_CLOSING_MINUTES }
    }
    return {
      scaleStartMinutes: Math.min(...enabledDays.map((day) => day.openingTimeMinutes)),
      scaleEndMinutes: Math.max(...enabledDays.map((day) => day.closingTimeMinutes)),
    }
  }, [settings.schedule])

  const slotCount = Math.max(Math.ceil((scaleEndMinutes - scaleStartMinutes) / slotMinutes), 1)
  const gridHeight = slotCount * SLOT_HEIGHT_PX
  const slotStarts = useMemo(
    () => Array.from({ length: slotCount }, (_, i) => scaleStartMinutes + i * slotMinutes),
    [slotCount, scaleStartMinutes, slotMinutes],
  )

  const dates = useMemo(() => weekDates(weekStart), [weekStart])

  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, Appointment[]>()
    for (const appointment of appointments) {
      const dateIso = DateTime.fromISO(appointment.scheduledTime, { zone: 'utc' }).setZone(zone).toISODate()
      if (!dateIso) {
        continue
      }
      const existing = map.get(dateIso)
      if (existing) {
        existing.push(appointment)
      } else {
        map.set(dateIso, [appointment])
      }
    }
    return map
  }, [appointments, zone])

  return (
    <Box
      sx={{
        overflow: 'auto',
        maxHeight: 'calc(100vh - 260px)',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '12px',
        backgroundColor: 'background.paper',
      }}
    >
      <Box sx={{ display: 'flex', minWidth: TIME_COLUMN_WIDTH + DAY_COLUMN_MIN_WIDTH * 7 }}>
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

        {WEEKDAY_ORDER.map((dayOfWeek, columnIndex) => {
          const date = DateTime.fromISO(dates[columnIndex])
          return (
            <Box
              key={dayOfWeek}
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
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {t(DAY_LABEL_KEYS[dayOfWeek])}
              </Typography>
              <Typography variant="caption">{date.toFormat('d')}</Typography>
            </Box>
          )
        })}
      </Box>

      <Box sx={{ display: 'flex', minWidth: TIME_COLUMN_WIDTH + DAY_COLUMN_MIN_WIDTH * 7 }}>
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
          {slotStarts.map((minutes) => (
            <Box key={minutes} sx={{ height: SLOT_HEIGHT_PX, position: 'relative' }}>
              <Typography
                variant="caption"
                sx={{ position: 'absolute', top: -8, right: 4, color: 'text.secondary' }}
              >
                {minutesToLabel(minutes)}
              </Typography>
            </Box>
          ))}
        </Box>

        {WEEKDAY_ORDER.map((dayOfWeek, columnIndex) => {
          const dateIso = dates[columnIndex]
          const daySchedule = scheduleByDay.get(dayOfWeek)
          const dayAppointments = appointmentsByDate.get(dateIso) ?? []

          return (
            <Box
              key={dayOfWeek}
              sx={{
                flex: 1,
                minWidth: DAY_COLUMN_MIN_WIDTH,
                height: gridHeight,
                position: 'relative',
                borderLeft: columnIndex > 0 ? '1px solid' : 'none',
                borderColor: 'divider',
              }}
            >
              {slotStarts.map((minutes, rowIndex) => {
                const isActive =
                  !!daySchedule?.isEnabled &&
                  minutes >= daySchedule.openingTimeMinutes &&
                  minutes < daySchedule.closingTimeMinutes

                return (
                  <Box
                    key={minutes}
                    sx={{
                      position: 'absolute',
                      top: rowIndex * SLOT_HEIGHT_PX,
                      left: 0,
                      right: 0,
                      height: SLOT_HEIGHT_PX,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      bgcolor: isActive ? 'transparent' : 'action.disabledBackground',
                      cursor: isActive ? 'pointer' : 'default',
                      '&:hover .schedule-slot-button': isActive ? { opacity: 1 } : undefined,
                    }}
                    onClick={isActive ? () => onScheduleSlot(dateIso, minutes) : undefined}
                  >
                    {isActive && (
                      <Button
                        className="schedule-slot-button"
                        variant="text"
                        size="small"
                        tabIndex={-1}
                        sx={{
                          position: 'absolute',
                          inset: 0,
                          height: '100%',
                          width: '100%',
                          opacity: 0,
                          borderRadius: 0,
                          minWidth: 0,
                        }}
                      >
                        {t('appointmentsPage.scheduleAppointment')}
                      </Button>
                    )}
                  </Box>
                )
              })}

              {dayAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  pxPerMinute={pxPerMinute}
                  scaleStartMinutes={scaleStartMinutes}
                  onOpenDetails={onOpenDetails}
                  onEdit={onEditAppointment}
                  onDelete={onDeleteAppointment}
                />
              ))}
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}
