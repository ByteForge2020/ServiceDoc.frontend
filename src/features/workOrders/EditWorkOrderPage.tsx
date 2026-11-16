import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { AxiosError } from 'axios'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import { extractErrorMessage } from '../../api/errorMessage'
import { useConfirm } from '../../app/confirm/useConfirm'
import { useShopTimeZone } from '../../app/shop/useShopTimeZone'
import { useToasters } from '../../app/toasters/useToasters'
import { usePhasesQuery } from '../settings/phases/queries'
import { WorkOrderFormLayout } from './components/WorkOrderFormLayout'
import { downloadBlob } from '../../utils/downloadBlob'
import { formatShopDateTime } from '../../utils/formatShopDateTime'
import {
  useDownloadWorkOrderPdfMutation,
  useReopenWorkOrderMutation,
  useUpdateWorkOrderMutation,
  useWorkOrderQuery,
} from './queries'
import {
  EMPTY_CUSTOMER,
  EMPTY_VEHICLE,
  buildCustomerPayload,
  buildEstimateItemsPayload,
  buildSparePartsPayload,
  buildVehiclePayload,
  customerToFormState,
  estimateItemsToFormState,
  isSparePartRowMissingName,
  sparePartsToFormState,
  vehicleToFormState,
  type EstimateItemRow,
  type SparePartRow,
} from './workOrderForm'

export function EditWorkOrderPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toasters = useToasters()
  const { data: workOrder, isPending: isLoadingWorkOrder } = useWorkOrderQuery(id)
  const confirm = useConfirm()
  const zone = useShopTimeZone()
  const mutation = useUpdateWorkOrderMutation(id ?? '')
  const reopenMutation = useReopenWorkOrderMutation(id ?? '')
  const pdfMutation = useDownloadWorkOrderPdfMutation(id ?? '')
  const { data: phases = [] } = usePhasesQuery()
  const closedPhaseId = phases.find((phase) => phase.systemType === 'Closed')?.id
  const closedInfoShownFor = useRef<string | null>(null)

  const [orderNumber, setOrderNumber] = useState('')
  const [orderNumberConflict, setOrderNumberConflict] = useState(false)
  const [notes, setNotes] = useState('')
  const [phaseId, setPhaseId] = useState('')
  const [customer, setCustomer] = useState(EMPTY_CUSTOMER)
  const [vehicle, setVehicle] = useState(EMPTY_VEHICLE)
  const [estimateItems, setEstimateItems] = useState<EstimateItemRow[]>([])
  const [spareParts, setSpareParts] = useState<SparePartRow[]>([])
  const [initializedKey, setInitializedKey] = useState<string | undefined>(undefined)
  // The phase is part of the key: returning a closed order to work changes it, which refills the form from the reopened order.
  const initKey = workOrder ? `${workOrder.id}:${workOrder.phaseId}` : undefined
  const initialized = initializedKey === initKey

  // Adjusting state when the query result arrives, per React's "you might not need an Effect"
  // guidance: setting state during render (guarded by the key check) avoids an extra effect pass.
  if (workOrder && !initialized) {
    setInitializedKey(initKey)
    setOrderNumber(workOrder.orderNumber)
    setNotes(workOrder.notes ?? '')
    setPhaseId(workOrder.phaseId)
    setCustomer(customerToFormState(workOrder.customer))
    setVehicle(vehicleToFormState(workOrder.vehicle))
    setEstimateItems(estimateItemsToFormState(workOrder.estimateItems))
    setSpareParts(sparePartsToFormState(workOrder.spareParts))
  }

  const canSave =
    orderNumber.trim().length > 0 && !spareParts.some(isSparePartRowMissingName) && !mutation.isPending

  // A closed order is read-only, so say so (and who closed it) when it is opened.
  useEffect(() => {
    if (!workOrder?.isClosed || closedInfoShownFor.current === workOrder.id) {
      return
    }

    closedInfoShownFor.current = workOrder.id

    const date = formatShopDateTime(workOrder.closedAt, zone)

    void confirm({
      title: t('workOrderForm.closedInfoTitle'),
      message: workOrder.closedByName
        ? t('workOrderForm.closedInfoBy', { name: workOrder.closedByName, date })
        : t('workOrderForm.closedInfoAt', { date }),
      confirmLabel: t('common.ok'),
      hideCancel: true,
    })
  }, [workOrder, zone, confirm, t])

  // `closePhaseId`: save the edits and close the order in the same request.
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
          toasters.success(t(closePhaseId ? 'workOrderForm.closeSuccess' : 'workOrderForm.updateSuccess'))
          navigate('/orders', { replace: true })
        },
        onError: (error) => {
          if (error instanceof AxiosError && error.response?.status === 409) {
            setOrderNumberConflict(true)
            toasters.error(t('workOrderForm.orderNumberConflict'))
            return
          }
          toasters.error(extractErrorMessage(error, t(closePhaseId ? 'workOrderForm.closeError' : 'workOrderForm.updateError')))
        },
      },
    )
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (!orderNumber.trim() || !workOrder) {
      return
    }

    submit()
  }

  // The Close button and choosing "Closed Order" in the phase select both end up here.
  async function handleCloseOrder() {
    if (!closedPhaseId || !workOrder) {
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

  // Back to the phase it was in when it was closed; the reopened order refills the form and unlocks it.
  function handleReopen() {
    reopenMutation.mutate(undefined, {
      onSuccess: () => toasters.success(t('workOrderForm.reopenSuccess')),
      onError: (error) => toasters.error(extractErrorMessage(error, t('workOrderForm.reopenError'))),
    })
  }

  // The PDF is rendered by the backend from the saved order, so unsaved form edits are not included.
  function handlePrintPdf() {
    if (!workOrder) {
      return
    }

    pdfMutation.mutate(undefined, {
      onSuccess: (blob) => downloadBlob(blob, `WorkOrder-${workOrder.orderNumber}.pdf`),
      onError: () => toasters.error(t('workOrderForm.printPdfError')),
    })
  }

  if (isLoadingWorkOrder || !workOrder || !initialized) {
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
      phaseId={phaseId}
      onPhaseChange={setPhaseId}
      savedPhase={{ id: workOrder.phaseId, name: workOrder.phaseName }}
      notes={notes}
      onNotesChange={setNotes}
      estimateItems={estimateItems}
      onEstimateItemsChange={setEstimateItems}
      discountType={workOrder.discountType}
      taxPercent={workOrder.taxPercent}
      spareParts={spareParts}
      onSparePartsChange={setSpareParts}
      onSubmit={handleSubmit}
      saving={mutation.isPending}
      saveLabel={t('workOrderForm.saveLabel')}
      canSave={canSave}
      readOnly={workOrder.isClosed}
      onCloseOrder={handleCloseOrder}
      onReopen={handleReopen}
      reopening={reopenMutation.isPending}
      onPrintPdf={handlePrintPdf}
      printingPdf={pdfMutation.isPending}
    />
  )
}
