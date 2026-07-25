import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { AxiosError } from 'axios'
import { extractErrorMessage } from '../../api/errorMessage'
import { useToasters } from '../../app/toasters/useToasters'
import { WorkOrderFormLayout } from './components/WorkOrderFormLayout'
import { useCreateWorkOrderMutation } from './queries'
import { EMPTY_CUSTOMER, EMPTY_VEHICLE, buildCustomerPayload, buildVehiclePayload } from './workOrderForm'

export function CreateWorkOrderPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const toasters = useToasters()
  const mutation = useCreateWorkOrderMutation()

  const [orderNumber, setOrderNumber] = useState('')
  const [orderNumberConflict, setOrderNumberConflict] = useState(false)
  const [notes, setNotes] = useState('')
  const [customer, setCustomer] = useState(EMPTY_CUSTOMER)
  const [vehicle, setVehicle] = useState(EMPTY_VEHICLE)

  const canSave = orderNumber.trim().length > 0 && !mutation.isPending

  function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (!orderNumber.trim()) {
      return
    }

    setOrderNumberConflict(false)

    mutation.mutate(
      {
        orderNumber: orderNumber.trim(),
        notes: notes.trim() ? notes.trim() : null,
        customer: buildCustomerPayload(customer),
        vehicle: buildVehiclePayload(vehicle),
      },
      {
        onSuccess: () => {
          toasters.success(t('workOrderForm.createSuccess'))
          navigate('/orders', { replace: true })
        },
        onError: (error) => {
          if (error instanceof AxiosError && error.response?.status === 409) {
            setOrderNumberConflict(true)
            toasters.error(t('workOrderForm.orderNumberConflict'))
            return
          }
          toasters.error(extractErrorMessage(error, t('workOrderForm.createError')))
        },
      },
    )
  }

  return (
    <WorkOrderFormLayout
      title={t('workOrderForm.newTitle')}
      onBack={() => navigate('/orders')}
      onCancel={() => navigate('/orders')}
      customer={customer}
      onCustomerChange={setCustomer}
      vehicle={vehicle}
      onVehicleChange={setVehicle}
      orderNumber={orderNumber}
      onOrderNumberChange={(value) => {
        setOrderNumber(value)
        setOrderNumberConflict(false)
      }}
      orderNumberError={orderNumberConflict}
      notes={notes}
      onNotesChange={setNotes}
      onSubmit={handleSubmit}
      saving={mutation.isPending}
      saveLabel={t('workOrderForm.createLabel')}
      canSave={canSave}
    />
  )
}
