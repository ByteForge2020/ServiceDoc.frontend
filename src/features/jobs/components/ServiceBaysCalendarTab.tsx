import { useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import { useTranslation } from 'react-i18next'
import { useConfirm } from '../../../app/confirm/useConfirm'
import { useShopTimeZone } from '../../../app/shop/useShopTimeZone'
import { useToasters } from '../../../app/toasters/useToasters'
import { AddAppointmentServiceBayBookingModal } from '../../appointmentSlots/components/AddAppointmentServiceBayBookingModal'
import { EditAppointmentServiceBayBookingModal } from '../../appointmentSlots/components/EditAppointmentServiceBayBookingModal'
import {
  useAppointmentServiceBayBookingsQuery,
  useDeleteAppointmentServiceBayBookingMutation,
  useRescheduleAppointmentServiceBayBookingMutation,
} from '../../appointmentSlots/queries'
import {
  appointmentBookingToCalendarEntry,
  type AppointmentServiceBayBooking,
} from '../../appointmentSlots/types'
import { useServiceBaysQuery } from '../../settings/serviceBays/queries'
import { AddServiceBayBookingModal } from '../../serviceBayBookings/components/AddServiceBayBookingModal'
import { EditServiceBayBookingModal } from '../../serviceBayBookings/components/EditServiceBayBookingModal'
import { bookingErrorMessage } from '../../serviceBayBookings/bookingErrorMessage'
import {
  useDeleteServiceBayBookingMutation,
  useRescheduleServiceBayBookingMutation,
  useServiceBayBookingsQuery,
} from '../../serviceBayBookings/queries'
import { bookingToCalendarEntry, type ServiceBayBooking } from '../../serviceBayBookings/types'
import { useFocusedEntryCheck } from '../useFocusedEntryCheck'
import { localDateAndMinutesToUtcIso } from '../../../utils/timeGrid'
import { FREE_MODE, type CalendarEntry, type CalendarEntryKind, type CalendarTabProps } from '../types'
import { ResourceCalendar } from './ResourceCalendar'
import type { CalendarAddAction } from './ResourceGrid'

interface AddBookingRequest {
  kind: CalendarEntryKind
  serviceBayId: string
  serviceBayName: string
  minutes: number
}

/** The service bays calendar: one row per bay; work orders' bookings and appointments' bookings as entries. */
export function ServiceBaysCalendarTab({
  selectedDate,
  onShiftDate,
  mode = FREE_MODE,
  maxHeight,
  onCreated,
  onUpdated,
  onDeleted,
  onFocusMissing,
}: CalendarTabProps) {
  const { t } = useTranslation()
  const toasters = useToasters()
  const confirm = useConfirm()
  const zone = useShopTimeZone()
  const [addRequest, setAddRequest] = useState<AddBookingRequest | null>(null)
  const [editingBooking, setEditingBooking] = useState<ServiceBayBooking | null>(null)
  const [editingAppointmentBooking, setEditingAppointmentBooking] = useState<AppointmentServiceBayBooking | null>(null)
  const deleteMutation = useDeleteServiceBayBookingMutation()
  const rescheduleMutation = useRescheduleServiceBayBookingMutation()
  const deleteAppointmentMutation = useDeleteAppointmentServiceBayBookingMutation()
  const rescheduleAppointmentMutation = useRescheduleAppointmentServiceBayBookingMutation()

  const { from, to } = useMemo(() => {
    return {
      from: localDateAndMinutesToUtcIso(selectedDate, 0, zone),
      to: localDateAndMinutesToUtcIso(selectedDate, 24 * 60, zone),
    }
  }, [selectedDate, zone])

  const { data: serviceBays, isPending: isServiceBaysPending } = useServiceBaysQuery()
  const {
    data: bookings,
    isPending: isBookingsPending,
    isPlaceholderData: isBookingsPlaceholder,
  } = useServiceBayBookingsQuery(from, to)
  const {
    data: appointmentBookings,
    isPending: isAppointmentBookingsPending,
    isPlaceholderData: isAppointmentBookingsPlaceholder,
  } = useAppointmentServiceBayBookingsQuery(from, to)

  const rows = useMemo(() => serviceBays ?? [], [serviceBays])
  const entries = useMemo(
    () => [
      ...(bookings ?? []).map(bookingToCalendarEntry),
      ...(appointmentBookings ?? []).map(appointmentBookingToCalendarEntry),
    ],
    [bookings, appointmentBookings],
  )

  const isPending = isServiceBaysPending || isBookingsPending || isAppointmentBookingsPending

  useFocusedEntryCheck(
    mode,
    !isPending && !isBookingsPlaceholder && !isAppointmentBookingsPlaceholder,
    entries,
    rows,
    onFocusMissing,
  )

  // Opened from a work order or an appointment, only that kind of booking can be added; on the Jobs screen both can.
  const addActions = useMemo<CalendarAddAction[]>(() => {
    const bookForOrder: CalendarAddAction = {
      key: 'order',
      label: t('jobs.addBookingPopup.bookServiceBay'),
      onSelect: ({ rowId, rowName, minutes }) =>
        setAddRequest({ kind: 'order', serviceBayId: rowId, serviceBayName: rowName, minutes }),
    }
    const bookForAppointment: CalendarAddAction = {
      key: 'appointment',
      label: t('jobs.addBookingPopup.bookServiceBayForAppointment'),
      onSelect: ({ rowId, rowName, minutes }) =>
        setAddRequest({ kind: 'appointment', serviceBayId: rowId, serviceBayName: rowName, minutes }),
    }

    switch (mode.kind) {
      case 'addToOrder':
        return [bookForOrder]
      case 'addToAppointment':
        return [bookForAppointment]
      default:
        return [bookForOrder, bookForAppointment]
    }
  }, [mode.kind, t])

  async function handleDelete(entry: CalendarEntry) {
    const isAppointment = entry.kind === 'appointment'

    const confirmed = await confirm({
      message: isAppointment
        ? t('appointmentSlots.bookings.deleteConfirmMessage', { number: entry.parentNumber })
        : t('serviceBayBookings.deleteConfirmMessage', { orderNumber: entry.parentNumber }),
      confirmLabel: t('serviceBayBookings.delete'),
      destructive: true,
    })

    if (!confirmed) {
      return
    }

    const mutation = isAppointment ? deleteAppointmentMutation : deleteMutation

    mutation.mutate(entry.id, {
      onSuccess: () => {
        toasters.success(t('serviceBayBookings.deleteSuccess'))
        onDeleted?.()
      },
      onError: (error) => {
        toasters.error(bookingErrorMessage(error, t('serviceBayBookings.deleteError')))
      },
    })
  }

  function handleMove({ entry, rowId, rowName, scheduledTime }: {
    entry: CalendarEntry
    rowId: string
    rowName: string
    scheduledTime: string
  }) {
    const mutation = entry.kind === 'appointment' ? rescheduleAppointmentMutation : rescheduleMutation

    mutation.mutate(
      { id: entry.id, serviceBayId: rowId, serviceBayName: rowName, scheduledTime },
      {
        onSuccess: () => {
          toasters.success(t('serviceBayBookings.dragDrop.rescheduleSuccess'))
        },
        onError: (error) => {
          toasters.error(bookingErrorMessage(error, t('serviceBayBookings.dragDrop.rescheduleError')))
        },
      },
    )
  }

  function handleEdit(entry: CalendarEntry) {
    if (entry.kind === 'appointment') {
      setEditingAppointmentBooking(appointmentBookings?.find((booking) => booking.id === entry.id) ?? null)
    } else {
      setEditingBooking(bookings?.find((booking) => booking.id === entry.id) ?? null)
    }
  }

  if (isPending) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <>
      <ResourceCalendar
        rows={rows}
        entries={entries}
        selectedDate={selectedDate}
        onShiftDate={onShiftDate}
        mode={mode}
        maxHeight={maxHeight}
        emptyRowsText={t('jobs.noServiceBays')}
        addActions={addActions}
        entryLabels={{
          menuAria: t('serviceBayBookings.menuAria'),
          edit: t('serviceBayBookings.edit'),
          delete: t('serviceBayBookings.delete'),
        }}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onMove={handleMove}
      />

      {addRequest?.kind === 'order' && (
        <AddServiceBayBookingModal
          open
          serviceBayId={addRequest.serviceBayId}
          serviceBayName={addRequest.serviceBayName}
          dateIso={selectedDate}
          minutes={addRequest.minutes}
          lockedOrder={mode.kind === 'addToOrder' ? mode.order : undefined}
          onCreated={onCreated}
          onClose={() => setAddRequest(null)}
        />
      )}

      {addRequest?.kind === 'appointment' && (
        <AddAppointmentServiceBayBookingModal
          open
          serviceBayId={addRequest.serviceBayId}
          serviceBayName={addRequest.serviceBayName}
          dateIso={selectedDate}
          minutes={addRequest.minutes}
          lockedAppointment={mode.kind === 'addToAppointment' ? mode.appointment : undefined}
          onCreated={onCreated}
          onClose={() => setAddRequest(null)}
        />
      )}

      {editingBooking && (
        <EditServiceBayBookingModal
          open
          booking={editingBooking}
          onUpdated={onUpdated}
          onClose={() => setEditingBooking(null)}
        />
      )}

      {editingAppointmentBooking && (
        <EditAppointmentServiceBayBookingModal
          open
          booking={editingAppointmentBooking}
          onUpdated={onUpdated}
          onClose={() => setEditingAppointmentBooking(null)}
        />
      )}
    </>
  )
}
