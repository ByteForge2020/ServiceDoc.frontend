import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { AxiosError } from 'axios'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import { extractErrorMessage } from '../../api/errorMessage'
import { useToasters } from '../../app/toasters/useToasters'
import { WorkOrderFormLayout } from './components/WorkOrderFormLayout'
import { useUpdateWorkOrderMutation, useWorkOrderQuery } from './queries'
import {
  EMPTY_CUSTOMER,
  EMPTY_VEHICLE,
  buildCustomerPayload,
  buildEstimatesPayload,
  buildVehiclePayload,
  customerToFormState,
  estimatesToFormState,
  vehicleToFormState,
  type EstimateFormState,
} from './workOrderForm'

export function EditWorkOrderPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toasters = useToasters()
  const { data: workOrder, isPending: isLoadingWorkOrder } = useWorkOrderQuery(id)
  const mutation = useUpdateWorkOrderMutation(id ?? '')

  const [orderNumber, setOrderNumber] = useState('')
  const [orderNumberConflict, setOrderNumberConflict] = useState(false)
  const [notes, setNotes] = useState('')
  const [customer, setCustomer] = useState(EMPTY_CUSTOMER)
  const [vehicle, setVehicle] = useState(EMPTY_VEHICLE)
  const [estimates, setEstimates] = useState<EstimateFormState[]>([])
  const [initializedId, setInitializedId] = useState<string | undefined>(undefined)
  const initialized = initializedId === workOrder?.id

  // Adjusting state when the query result arrives, per React's "you might not need an Effect"
  // guidance: setting state during render (guarded by the id check) avoids an extra effect pass.
  if (workOrder && !initialized) {
    setInitializedId(workOrder.id)
    setOrderNumber(workOrder.orderNumber)
    setNotes(workOrder.notes ?? '')
    setCustomer(customerToFormState(workOrder.customer))
    setVehicle(vehicleToFormState(workOrder.vehicle))
    setEstimates(estimatesToFormState(workOrder.estimates))
  }

  const canSave = orderNumber.trim().length > 0 && !mutation.isPending

  function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (!orderNumber.trim() || !workOrder) {
      return
    }

    setOrderNumberConflict(false)

    mutation.mutate(
      {
        orderNumber: orderNumber.trim(),
        status: workOrder.status,
        notes: notes.trim() ? notes.trim() : null,
        closedAt: workOrder.closedAt,
        customer: buildCustomerPayload(customer),
        vehicle: buildVehiclePayload(vehicle),
        estimates: buildEstimatesPayload(estimates),
      },
      {
        onSuccess: () => {
          toasters.success(t('workOrderForm.updateSuccess'))
          navigate('/orders', { replace: true })
        },
        onError: (error) => {
          if (error instanceof AxiosError && error.response?.status === 409) {
            setOrderNumberConflict(true)
            toasters.error(t('workOrderForm.orderNumberConflict'))
            return
          }
          toasters.error(extractErrorMessage(error, t('workOrderForm.updateError')))
        },
      },
    )
  }

  if (isLoadingWorkOrder || !initialized) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <WorkOrderFormLayout
      title={t('workOrderForm.editTitle')}
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
      estimates={estimates}
      onEstimatesChange={setEstimates}
      onSubmit={handleSubmit}
      saving={mutation.isPending}
      saveLabel={t('workOrderForm.saveLabel')}
      canSave={canSave}
    />
  )
}
