import { useState, type FormEvent } from 'react'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import { AxiosError } from 'axios'
import { DateTime } from 'luxon'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { extractErrorMessage } from '../../api/errorMessage'
import { useShopTimeZone } from '../../app/shop/useShopTimeZone'
import { useToasters } from '../../app/toasters/useToasters'
import { localDateAndMinutesToUtcIso } from '../../utils/timeGrid'
import { useAppointmentSettingsQuery } from '../settings/appointments/queries'
import { EMPTY_CUSTOMER, EMPTY_VEHICLE, buildCustomerPayload, buildVehiclePayload } from '../workOrders/workOrderForm'
import { AppointmentFormLayout } from './components/AppointmentFormLayout'
import { useCreateAppointmentMutation } from './queries'
import type { AppointmentReason } from './types'

interface ScheduleSlotState {
  dateIso: string
  minutes: number
}

export function CreateAppointmentPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const zone = useShopTimeZone()
  const toasters = useToasters()
  const mutation = useCreateAppointmentMutation()
  const { data: settings, isPending: isSettingsPending } = useAppointmentSettingsQuery()

  const prefill = location.state as ScheduleSlotState | null

  const [number, setNumber] = useState('')
  const [numberConflict, setNumberConflict] = useState(false)
  const [customer, setCustomer] = useState(EMPTY_CUSTOMER)
  const [vehicle, setVehicle] = useState(EMPTY_VEHICLE)
  const [reasons, setReasons] = useState<AppointmentReason[]>([])
  const [date, setDate] = useState<DateTime | null>(
    prefill ? DateTime.fromISO(prefill.dateIso, { zone }) : DateTime.local().setZone(zone).startOf('day'),
  )
  const [minutes, setMinutes] = useState<number | null>(prefill?.minutes ?? null)

  if (isSettingsPending || !settings) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  const customerPayload = buildCustomerPayload(customer)
  const vehiclePayload = buildVehiclePayload(vehicle)
  const defaultDurationMinutes = settings.defaultAppointmentDurationMinutes

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

    if (!canSave || !date || minutes === null || reasons.length === 0) {
      return
    }

    setNumberConflict(false)

    mutation.mutate(
      {
        number: number.trim(),
        customer: customerPayload,
        vehicle: vehiclePayload,
        reasonIds: reasons.map((reason) => reason.id),
        scheduledTime: localDateAndMinutesToUtcIso(date.toISODate()!, minutes, zone),
        durationMinutes: defaultDurationMinutes,
      },
      {
        onSuccess: () => {
          toasters.success(t('appointmentForm.createSuccess'))
          navigate('/appointments', { replace: true })
        },
        onError: (error) => {
          if (error instanceof AxiosError && error.response?.status === 409) {
            setNumberConflict(true)
            toasters.error(t('appointmentForm.numberConflict'))
            return
          }
          toasters.error(extractErrorMessage(error, t('appointmentForm.createError')))
        },
      },
    )
  }

  return (
    <AppointmentFormLayout
      title={t('appointmentForm.newTitle')}
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
      saveLabel={t('appointmentForm.createLabel')}
      canSave={canSave}
    />
  )
}
