import Chip, { type ChipProps } from '@mui/material/Chip'
import type { WorkOrderStatus } from './types'

const STATUS_COLOR: Record<WorkOrderStatus, ChipProps['color']> = {
  Draft: 'default',
  Open: 'info',
  InProgress: 'warning',
  Completed: 'success',
  Cancelled: 'error',
}

const STATUS_LABEL: Record<WorkOrderStatus, string> = {
  Draft: 'Draft',
  Open: 'Open',
  InProgress: 'In progress',
  Completed: 'Completed',
  Cancelled: 'Cancelled',
}

export function WorkOrderStatusChip({ status }: { status: WorkOrderStatus }) {
  return <Chip size="small" color={STATUS_COLOR[status]} label={STATUS_LABEL[status]} />
}
