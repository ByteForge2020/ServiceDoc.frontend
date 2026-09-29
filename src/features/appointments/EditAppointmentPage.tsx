import { useState, type FormEvent } from 'react'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import { AxiosError } from 'axios'
import { DateTime } from 'luxon'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { extractErrorMessage } from '../../api/errorMessage'
import { useShopTimeZone } from '../../app/shop/useShopTimeZone'
import { useToasters } from '../../app/toasters/useToasters'
import { localDateAndMinutesToUtcIso, utcIsoToMinutesOfDay } from '../../utils/timeGrid'
import { useAppointmentSettingsQuery } from '../settings/appointments/queries'
import {
  EMPTY_CUSTOMER,
  EMPTY_VEHICLE,
  buildCustomerPayload,
  buildVehiclePayload,
  customerToFormState,
  vehicleToFormState,
} from '../workOrders/workOrderForm'
import { AppointmentFormLayout } from './components/AppointmentFormLayout'
import { useAppointmentQuery, useUpdateAppointmentMutation } from './queries'
import type { AppointmentReason } from './types'

export function EditAppointmentPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const zone = useShopTimeZone()
  const toasters = useToasters()
  const { data: appointment, isPending: isLoadingAppointment } = useAppointmentQuery(id)
  const { data: settings, isPending: isSettingsPending } = useAppointmentSettingsQuery()
  const mutation = useUpdateAppointmentMutation(id ?? '')

  const [number, setNumber] = useState('')
  const [numberConflict, setNumberConflict] = useState(false)
  const [customer, setCustomer] = useState(EMPTY_CUSTOMER)
  const [vehicle, setVehicle] = useState(EMPTY_VEHICLE)
  const [reasons, setReasons] = useState<AppointmentReason[]>([])
  const [date, setDate] = useState<DateTime | null>(null)
  const [minutes, setMinutes] = useState<number | null>(null)
  const [initializedId, setInitializedId] = useState<string | undefined>(undefined)
  const initialized = initializedId === appointment?.id

  // Adjusting state when the query result arrives, per React's "you might not need an Effect"
  // guidance: setting state during render (guarded by the id check) avoids an extra effect pass.
  if (appointment && !initialized) {
    setInitializedId(appointment.id)
    setNumber(appointment.number)
    setCustomer(customerToFormState(appointment.customer))
    setVehicle(vehicleToFormState(appointment.vehicle))
    setReasons(appointment.reasons)
    setDate(DateTime.fromISO(appointment.scheduledTime, { zone: 'utc' }).setZone(zone).startOf('day'))
    setMinutes(utcIsoToMinutesOfDay(appointment.scheduledTime, zone))
  }

  if (isLoadingAppointment || isSettingsPending || !settings || !initialized) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  const customerPayload = buildCustomerPayload(customer)
  const vehiclePayload = buildVehiclePayload(vehicle)

  const canSave =
    number.trim().length > 0 &&
    !!customerPayload &&
    !!vehiclePayload &&
    reasons.length > 0 &&
    !!date &&
    date.isValid &&
    minutes !== null &&
    !mutation.isPending

  function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (!canSave || !date || minutes === null || reasons.length === 0 || !appointment) {
      return
    }

    setNumberConflict(false)

    mutation.mutate(
      {
        number: number.trim(),
        status: appointment.status,
        customer: customerPayload,
        vehicle: vehiclePayload,
        estimateMasterListIds: reasons.map((reason) => reason.id),
        scheduledTime: localDateAndMinutesToUtcIso(date.toISODate()!, minutes, zone),
        durationMinutes: appointment.durationMinutes,
      },
      {
        onSuccess: () => {
          toasters.success(t('appointmentForm.updateSuccess'))
          navigate('/appointments', { replace: true })
        },
        onError: (error) => {
          if (error instanceof AxiosError && error.response?.status === 409) {
            setNumberConflict(true)
            toasters.error(t('appointmentForm.numberConflict'))
            return
          }
          toasters.error(extractErrorMessage(error, t('appointmentForm.updateError')))
        },
      },
    )
  }

  return (
    <AppointmentFormLayout
      title={t('appointmentForm.editTitle')}
      onBack={() => navigate('/appointments')}
      onCancel={() => navigate('/appointments')}
      customer={customer}
      onCustomerChange={setCustomer}
      vehicle={vehicle}
      onVehicleChange={setVehicle}
      reasons={reasons}
      onReasonsChange={setReasons}
      date={date}
      onDateChange={setDate}
      minutes={minutes}
      onMinutesChange={setMinutes}
      settings={settings}
      number={number}
      onNumberChange={(value) => {
        setNumber(value)
        setNumberConflict(false)
      }}
      numberError={numberConflict}
      onSubmit={handleSubmit}
      saving={mutation.isPending}
      saveLabel={t('appointmentForm.saveLabel')}
      canSave={canSave}
    />
  )
}
