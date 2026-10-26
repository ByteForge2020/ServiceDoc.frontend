import { useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import CloseIcon from '@mui/icons-material/Close'
import { DateTime } from 'luxon'
import { useTranslation } from 'react-i18next'
import { useShopTimeZone } from '../../../app/shop/useShopTimeZone'
import { AppDatePicker } from '../../../components/form/AppDatePicker'
import { AppTimeField } from '../../../components/form/AppTimeField'
import { useWorkOrderQuery } from '../../workOrders/queries'
import type { WorkOrderSummary } from '../../workOrders/types'
import type { JobDescription, JobDescriptionPayload } from '../types'
import { JobDescriptionsField, type JobDescriptionDraft } from './JobDescriptionsField'
import { OrderPicker } from './OrderPicker'

export interface JobFormValues {
  orderId: string
  scheduledTime: string
  scheduledDurationMinutes: number
  descriptions: JobDescriptionPayload[]
}

interface JobFormModalProps {
  open: boolean
  title: string
  initialOrder: WorkOrderSummary | null
  /** The order can't be changed (it is shown as fixed text). */
  lockOrder?: boolean
  initialDateIso: string
  initialMinutes: number
  initialDurationMinutes: number
  initialDescriptions: JobDescription[]
  isSaving: boolean
  onClose: () => void
  onSave: (values: JobFormValues) => void
}

export function JobFormModal({
  open,
  title,
  initialOrder,
  lockOrder = false,
  initialDateIso,
  initialMinutes,
  initialDurationMinutes,
  initialDescriptions,
  isSaving,
  onClose,
  onSave,
}: JobFormModalProps) {
  const { t } = useTranslation()
  const zone = useShopTimeZone()

  const [selectedOrder, setSelectedOrder] = useState<WorkOrderSummary | null>(initialOrder)
  const [startDate, setStartDate] = useState<DateTime>(DateTime.fromISO(initialDateIso, { zone }))
  const [startMinutes, setStartMinutes] = useState<number>(initialMinutes)
  const [durationMinutes, setDurationMinutes] = useState<number>(initialDurationMinutes)
  const [descriptions, setDescriptions] = useState<JobDescriptionDraft[]>(() =>
    initialDescriptions.map((description) => ({
      key: description.id,
      id: description.id,
      estimateItemId: description.estimateItemId,
      name: description.name,
    })),
  )

  const { data: order } = useWorkOrderQuery(selectedOrder?.id)

  const serviceOptions = useMemo(
    () => (order?.estimates ?? []).flatMap((estimate) => estimate.items.map((item) => ({ id: item.id, name: item.name }))),
    [order],
  )

  // An empty list of descriptions is valid.
  const canSave = !!selectedOrder && startDate.isValid && durationMinutes > 0

  // Services belong to one order, so they are dropped when the order changes; custom descriptions stay.
  function dropServiceDescriptions() {
    setDescriptions((current) => current.filter((description) => description.estimateItemId === null))
  }

  function handleSelectOrder(newOrder: WorkOrderSummary) {
    setSelectedOrder(newOrder)
    dropServiceDescriptions()
  }

  function handleChangeOrder() {
    setSelectedOrder(null)
    dropServiceDescriptions()
  }

  function handleSave() {
    if (!canSave || !selectedOrder) {
      return
    }

    const scheduledTime = startDate
      .set({ hour: Math.floor(startMinutes / 60), minute: startMinutes % 60, second: 0, millisecond: 0 })
      .toUTC()
      .toISO()!

    onSave({
      orderId: selectedOrder.id,
      scheduledTime,
      scheduledDurationMinutes: durationMinutes,
      descriptions: descriptions.map(({ id, estimateItemId, name }) => ({ id, estimateItemId, name })),
    })
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { borderRadius: '12px' } } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {title}
        <IconButton onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>
          <OrderPicker
            selectedOrder={selectedOrder}
            locked={lockOrder}
            onSelect={handleSelectOrder}
            onChangeOrder={handleChangeOrder}
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <AppDatePicker label={t('jobs.addJobModal.startDate')} value={startDate} onChange={(value) => value && setStartDate(value)} required />
            <AppTimeField
              label={t('jobs.addJobModal.startHour')}
              value={startMinutes}
              onChange={setStartMinutes}
              stepMinutes={5}
              required
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <AppTimeField
              label={t('jobs.addJobModal.scheduledDuration')}
              value={durationMinutes}
              onChange={setDurationMinutes}
              stepMinutes={15}
              required
            />
          </Box>

          <JobDescriptionsField
            services={serviceOptions}
            descriptions={descriptions}
            onChange={setDescriptions}
            disabled={!selectedOrder}
            placeholder={
              selectedOrder ? t('jobs.addJobModal.addDescriptionPlaceholder') : t('jobs.addJobModal.selectOrderFirst')
            }
          />

          <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end', pt: 1 }}>
            <Button variant="text" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button variant="contained" onClick={handleSave} disabled={!canSave} loading={isSaving}>
              {t('jobs.addJobModal.save')}
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  )
}
