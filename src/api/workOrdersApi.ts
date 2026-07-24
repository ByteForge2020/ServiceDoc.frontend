import { apiClient } from './apiClient'
import type { CreateWorkOrderRequest, UpdateWorkOrderRequest, WorkOrder } from '../features/workOrders/types'

const BASE_PATH = '/api/general/workorders'

export const workOrdersApi = {
  getAll() {
    return apiClient.get<WorkOrder[]>(BASE_PATH).then((res) => res.data)
  },

  getById(id: string) {
    return apiClient.get<WorkOrder>(`${BASE_PATH}/${id}`).then((res) => res.data)
  },

  create(request: CreateWorkOrderRequest) {
    return apiClient.post<WorkOrder>(BASE_PATH, request).then((res) => res.data)
  },

  update(id: string, request: UpdateWorkOrderRequest) {
    return apiClient.put<WorkOrder>(`${BASE_PATH}/${id}`, request).then((res) => res.data)
  },
}
