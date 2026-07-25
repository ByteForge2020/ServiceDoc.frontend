import Chip, { type ChipProps } from '@mui/material/Chip'
import { useTranslation } from 'react-i18next'
import type { WorkOrderStatus } from './types'

const STATUS_COLOR: Record<WorkOrderStatus, ChipProps['color']> = {
  Draft: 'default',
  Open: 'primary',
  InProgress: 'warning',
  Completed: 'success',
  Cancelled: 'error',
}

const STATUS_LABEL_KEY: Record<WorkOrderStatus, string> = {
  Draft: 'workOrders.status.draft',
  Open: 'workOrders.status.open',
  InProgress: 'workOrders.status.inProgress',
  Completed: 'workOrders.status.completed',
  Cancelled: 'workOrders.status.cancelled',
}

export function WorkOrderStatusChip({ status }: { status: WorkOrderStatus }) {
  const { t } = useTranslation()
  return <Chip size="small" color={STATUS_COLOR[status]} label={t(STATUS_LABEL_KEY[status])} />
}
