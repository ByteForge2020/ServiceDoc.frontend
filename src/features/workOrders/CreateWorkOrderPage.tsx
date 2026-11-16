import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { AxiosError } from 'axios'
import { extractErrorMessage } from '../../api/errorMessage'
import { useConfirm } from '../../app/confirm/useConfirm'
import { useShopSettingsQuery } from '../../app/shop/queries'
import { useToasters } from '../../app/toasters/useToasters'
import { usePhasesQuery } from '../settings/phases/queries'
import { WorkOrderFormLayout } from './components/WorkOrderFormLayout'
import { useCreateWorkOrderMutation } from './queries'
import {
  EMPTY_CUSTOMER,
  EMPTY_VEHICLE,
  buildCustomerPayload,
  buildEstimateItemsPayload,
  buildSparePartsPayload,
  buildVehiclePayload,
  isSparePartRowMissingName,
  type EstimateItemRow,
  type SparePartRow,
} from './workOrderForm'

export function CreateWorkOrderPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const toasters = useToasters()
  const confirm = useConfirm()
  const mutation = useCreateWorkOrderMutation()
  const { data: phases = [] } = usePhasesQuery()
  const closedPhaseId = phases.find((phase) => phase.systemType === 'Closed')?.id
  // The order takes the shop's discount type as it is when the order is created.
  const { data: shopSettings } = useShopSettingsQuery()

  const [orderNumber, setOrderNumber] = useState('')
  const [orderNumberConflict, setOrderNumberConflict] = useState(false)
  const [notes, setNotes] = useState('')
  const [phaseId, setPhaseId] = useState('')
  const [customer, setCustomer] = useState(EMPTY_CUSTOMER)
  const [vehicle, setVehicle] = useState(EMPTY_VEHICLE)
  const [estimateItems, setEstimateItems] = useState<EstimateItemRow[]>([])
  const [spareParts, setSpareParts] = useState<SparePartRow[]>([])

  const canSave =
    orderNumber.trim().length > 0 && !spareParts.some(isSparePartRowMissingName) && !mutation.isPending

  // `closePhaseId`: create the order straight into "Closed Order", i.e. save and close it in one go.
  function submit(closePhaseId?: string) {
    setOrderNumberConflict(false)

    mutation.mutate(
      {
        orderNumber: orderNumber.trim(),
        phaseId: closePhaseId ?? (phaseId || null),
        notes: notes.trim() ? notes.trim() : null,
        customer: buildCustomerPayload(customer),
        vehicle: buildVehiclePayload(vehicle),
        estimateItems: buildEstimateItemsPayload(estimateItems),
        spareParts: buildSparePartsPayload(spareParts),
      },
      {
        onSuccess: () => {
          toasters.success(t(closePhaseId ? 'workOrderForm.closeSuccess' : 'workOrderForm.createSuccess'))
          navigate('/orders', { replace: true })
        },
        onError: (error) => {
          if (error instanceof AxiosError && error.response?.status === 409) {
            setOrderNumberConflict(true)
            toasters.error(t('workOrderForm.orderNumberConflict'))
            return
          }
          toasters.error(extractErrorMessage(error, t(closePhaseId ? 'workOrderForm.closeError' : 'workOrderForm.createError')))
        },
      },
    )
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (!orderNumber.trim()) {
      return
    }

    submit()
  }

  // The Close button and choosing "Closed Order" in the phase select both end up here.
  async function handleCloseOrder() {
    if (!closedPhaseId) {
      return
    }

    if (!canSave) {
      toasters.error(t('workOrderForm.closeNeedsValidData'))
      return
    }

    const confirmed = await confirm({
      title: t('workOrderForm.closeConfirmTitle'),
      message: t('workOrderForm.closeConfirmMessage'),
      confirmLabel: t('workOrderForm.closeOrder'),
      destructive: true,
    })

    if (confirmed) {
      submit(closedPhaseId)
    }
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
      phaseId={phaseId}
      onPhaseChange={setPhaseId}
      notes={notes}
      onNotesChange={setNotes}
      estimateItems={estimateItems}
      onEstimateItemsChange={setEstimateItems}
      discountType={shopSettings?.discountType ?? 'Percent'}
      taxPercent={shopSettings?.priceIncludesTax ? (shopSettings.taxPercent ?? null) : null}
      spareParts={spareParts}
      onSparePartsChange={setSpareParts}
      onSubmit={handleSubmit}
      saving={mutation.isPending}
      saveLabel={t('workOrderForm.createLabel')}
      canSave={canSave}
      onCloseOrder={handleCloseOrder}
    />
  )
}
