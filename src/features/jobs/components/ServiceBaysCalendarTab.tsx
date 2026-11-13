import { useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import { useTranslation } from 'react-i18next'
import { useConfirm } from '../../../app/confirm/useConfirm'
import { useToasters } from '../../../app/toasters/useToasters'
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
import { useCalendarPreferencesStore } from '../calendarPreferencesStore'
import { appointmentParent, orderParent } from '../slotParent'
import { useCalendarRange } from '../useCalendarRange'
import { useFocusedEntryCheck } from '../useFocusedEntryCheck'
import { FREE_MODE, type CalendarEntry, type CalendarTabProps } from '../types'
import { ResourceCalendar } from './ResourceCalendar'
import type { CalendarAddAction } from './ResourceGrid'
import { ResourceFilter } from './ResourceFilter'
import { ResourceWeekGrid } from './ResourceWeekGrid'

interface AddBookingRequest {
  /** Null when the click wasn't on a bay's row (the week view): it is chosen in the form. */
  serviceBayId: string | null
  dateIso: string
  minutes: number
}

/** The service bays calendar: one row per bay; work orders' bookings and appointments' bookings as entries. */
export function ServiceBaysCalendarTab({
  selectedDate,
  view = 'day',
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
  const [addRequest, setAddRequest] = useState<AddBookingRequest | null>(null)
  const [editingBooking, setEditingBooking] = useState<ServiceBayBooking | null>(null)
  const [editingAppointmentBooking, setEditingAppointmentBooking] = useState<AppointmentServiceBayBooking | null>(null)
  // The week view shows every bay together unless some are picked; the pick is remembered.
  const storedFilterIds = useCalendarPreferencesStore((state) => state.serviceBayFilterIds)
  const setFilterIds = useCalendarPreferencesStore((state) => state.setServiceBayFilterIds)
  const deleteMutation = useDeleteServiceBayBookingMutation()
  const rescheduleMutation = useRescheduleServiceBayBookingMutation()
  const deleteAppointmentMutation = useDeleteAppointmentServiceBayBookingMutation()
  const rescheduleAppointmentMutation = useRescheduleAppointmentServiceBayBookingMutation()

  const { weekStart, from, to } = useCalendarRange(selectedDate, view)

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
  // A remembered bay may be deleted since: only those that still exist count, so the week can't end up empty.
  const filterIds = useMemo(
    () => storedFilterIds.filter((id) => rows.some((row) => row.id === id)),
    [storedFilterIds, rows],
  )
  const visibleEntries = useMemo(
    () => (filterIds.length === 0 ? entries : entries.filter((entry) => filterIds.includes(entry.rowId))),
    [entries, filterIds],
  )

  const isPending = isServiceBaysPending || isBookingsPending || isAppointmentBookingsPending

  useFocusedEntryCheck(
    mode,
    !isPending && !isBookingsPlaceholder && !isAppointmentBookingsPlaceholder,
    entries,
    rows,
    onFocusMissing,
  )

  // One way to book: a click on an empty place opens the form, where a work order or an appointment is picked
  // (or it is already known, when the calendar was opened from one).
  const addActions = useMemo<CalendarAddAction[]>(
    () => [
      {
        key: 'book',
        label: t('jobs.addBookingPopup.bookServiceBay'),
        onSelect: ({ rowId, minutes, dateIso }) =>
          setAddRequest({ serviceBayId: rowId, dateIso: dateIso ?? selectedDate, minutes }),
      },
    ],
    [selectedDate, t],
  )

  const lockedParent =
    mode.kind === 'addToOrder'
      ? orderParent(mode.order)
      : mode.kind === 'addToAppointment'
        ? appointmentParent(mode.appointment)
        : undefined

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

  const entryLabels = {
    menuAria: t('serviceBayBookings.menuAria'),
    edit: t('serviceBayBookings.edit'),
    delete: t('serviceBayBookings.delete'),
  }

  return (
    <>
      {view === 'week' ? (
        <Stack spacing={2}>
          <ResourceFilter
            placeholder={t('jobs.filter.serviceBays')}
            options={rows}
            selectedIds={filterIds}
            onChange={setFilterIds}
          />
          <ResourceWeekGrid
            weekStart={weekStart}
            resourceKind="serviceBay"
            allEntries={entries}
            entries={visibleEntries}
            defaultRowId={filterIds.length === 1 ? filterIds[0] : null}
            maxHeight={maxHeight}
            addActions={addActions}
            entryLabels={entryLabels}
            onShiftWeek={onShiftDate}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onMove={handleMove}
          />
        </Stack>
      ) : (
        <ResourceCalendar
          rows={rows}
          entries={entries}
          selectedDate={selectedDate}
          onShiftDate={onShiftDate}
          mode={mode}
          maxHeight={maxHeight}
          emptyRowsText={t('jobs.noServiceBays')}
          addActions={addActions}
          entryLabels={entryLabels}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onMove={handleMove}
        />
      )}

      {addRequest && (
        <AddServiceBayBookingModal
          open
          serviceBayId={addRequest.serviceBayId}
          dateIso={addRequest.dateIso}
          minutes={addRequest.minutes}
          lockedParent={lockedParent}
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
