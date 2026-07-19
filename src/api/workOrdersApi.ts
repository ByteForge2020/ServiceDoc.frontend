import { apiClient } from './apiClient'
import type { WorkOrder } from '../features/workOrders/types'

const BASE_PATH = '/api/general/workorders'

export const workOrdersApi = {
  getAll() {
    return apiClient.get<WorkOrder[]>(BASE_PATH).then((res) => res.data)
  },

  getById(id: string) {
    return apiClient.get<WorkOrder>(`${BASE_PATH}/${id}`).then((res) => res.data)
  },
}
