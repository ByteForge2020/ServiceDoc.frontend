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
import { FormSelect } from '../../../components/form/FormSelect'
import { useWorkOrderQuery } from '../../workOrders/queries'
import type { WorkOrderSummary } from '../../workOrders/types'
import { OrderPicker } from './OrderPicker'

export interface JobFormValues {
  orderId: string
  scheduledTime: string
  scheduledDurationMinutes: number
  estimateItemId: string | null
}

interface JobFormModalProps {
  open: boolean
  title: string
  initialOrder: WorkOrderSummary | null
  initialDateIso: string
  initialMinutes: number
  initialDurationMinutes: number
  initialEstimateItemId: string | null
  isSaving: boolean
  onClose: () => void
  onSave: (values: JobFormValues) => void
}

export function JobFormModal({
  open,
  title,
  initialOrder,
  initialDateIso,
  initialMinutes,
  initialDurationMinutes,
  initialEstimateItemId,
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
  const [estimateItemId, setEstimateItemId] = useState<string | ''>(initialEstimateItemId ?? '')

  const { data: order } = useWorkOrderQuery(selectedOrder?.id)

  const estimateItemOptions = useMemo(
    () =>
      (order?.estimates ?? []).flatMap((estimate) =>
        estimate.items.map((item) => ({ value: item.id, label: item.name })),
      ),
    [order],
  )

  const canSave = !!selectedOrder && startDate.isValid && durationMinutes > 0

  function handleSelectOrder(newOrder: WorkOrderSummary) {
    setSelectedOrder(newOrder)
    setEstimateItemId('')
  }

  function handleChangeOrder() {
    setSelectedOrder(null)
    setEstimateItemId('')
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
      estimateItemId: estimateItemId || null,
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
          <OrderPicker selectedOrder={selectedOrder} onSelect={handleSelectOrder} onChangeOrder={handleChangeOrder} />

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

            <FormSelect
              label={t('jobs.addJobModal.jobDescription')}
              placeholder={
                selectedOrder ? t('jobs.addJobModal.noEstimateItems') : t('jobs.addJobModal.selectOrderFirst')
              }
              value={estimateItemId}
              onChange={(value) => setEstimateItemId(value)}
              options={estimateItemOptions}
              disabled={!selectedOrder || estimateItemOptions.length === 0}
            />
          </Box>

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
