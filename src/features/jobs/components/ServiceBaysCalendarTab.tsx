import { useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import { useTranslation } from 'react-i18next'
import { useConfirm } from '../../../app/confirm/useConfirm'
import { useShopTimeZone } from '../../../app/shop/useShopTimeZone'
import { useToasters } from '../../../app/toasters/useToasters'
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
import { FREE_MODE, type CalendarEntry, type CalendarTabProps } from '../types'
import { ResourceCalendar } from './ResourceCalendar'

interface AddBookingRequest {
  serviceBayId: string
  serviceBayName: string
  minutes: number
}

/** The service bays calendar: one row per bay, bookings as entries. */
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
  const deleteMutation = useDeleteServiceBayBookingMutation()
  const rescheduleMutation = useRescheduleServiceBayBookingMutation()

  const { from, to } = useMemo(() => {
    return {
      from: localDateAndMinutesToUtcIso(selectedDate, 0, zone),
      to: localDateAndMinutesToUtcIso(selectedDate, 24 * 60, zone),
    }
  }, [selectedDate, zone])

  const { data: serviceBays, isPending: isServiceBaysPending } = useServiceBaysQuery()
  const { data: bookings, isPending: isBookingsPending, isPlaceholderData } = useServiceBayBookingsQuery(from, to)

  const rows = useMemo(() => serviceBays ?? [], [serviceBays])
  const entries = useMemo(() => (bookings ?? []).map(bookingToCalendarEntry), [bookings])

  useFocusedEntryCheck(
    mode,
    !isBookingsPending && !isServiceBaysPending && !isPlaceholderData,
    entries,
    rows,
    onFocusMissing,
  )

  async function handleDelete(entry: CalendarEntry) {
    const confirmed = await confirm({
      message: t('serviceBayBookings.deleteConfirmMessage', { orderNumber: entry.orderNumber }),
      confirmLabel: t('serviceBayBookings.delete'),
      destructive: true,
    })

    if (!confirmed) {
      return
    }

    deleteMutation.mutate(entry.id, {
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
    rescheduleMutation.mutate(
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

  if (isServiceBaysPending || isBookingsPending) {
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
        addLabel={t('jobs.addBookingPopup.bookServiceBay')}
        entryLabels={{
          menuAria: t('serviceBayBookings.menuAria'),
          edit: t('serviceBayBookings.edit'),
          delete: t('serviceBayBookings.delete'),
        }}
        onAdd={({ rowId, rowName, minutes }) =>
          setAddRequest({ serviceBayId: rowId, serviceBayName: rowName, minutes })
        }
        onEdit={(entry) => setEditingBooking(bookings?.find((booking) => booking.id === entry.id) ?? null)}
        onDelete={handleDelete}
        onMove={handleMove}
      />

      {addRequest && (
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

      {editingBooking && (
        <EditServiceBayBookingModal
          open
          booking={editingBooking}
          onUpdated={onUpdated}
          onClose={() => setEditingBooking(null)}
        />
      )}
    </>
  )
}
