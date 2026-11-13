import { useCallback } from 'react'
import { DateTime } from 'luxon'
import { useTranslation } from 'react-i18next'
import { useShopTimeZone } from '../../app/shop/useShopTimeZone'
import type { AppointmentSummary } from '../appointments/types'

/** "Mon, 9 Nov, 14:30" in the shop's zone: enough to tell apart appointments with similar numbers. */
function useAppointmentWhen() {
  const zone = useShopTimeZone()
  const { i18n } = useTranslation()

  return useCallback(
    (scheduledTime: string) =>
      DateTime.fromISO(scheduledTime, { zone: 'utc' }).setZone(zone).setLocale(i18n.language).toFormat('ccc, d LLL, HH:mm'),
    [zone, i18n.language],
  )
}

/** The second line under an appointment's number: who it is for, and when. */
export function useAppointmentDetails() {
  const when = useAppointmentWhen()

  // Stable between renders, so lists built from it aren't rebuilt every time.
  return useCallback(
    (appointment: AppointmentSummary) =>
      [appointment.customerName, appointment.vehicleDescription, when(appointment.scheduledTime)]
        .filter((part): part is string => !!part)
        .join(' · '),
    [when],
  )
}
