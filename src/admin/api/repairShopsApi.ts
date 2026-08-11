import { adminApiClient } from './adminApiClient'
import type { RepairShop, RepairShopPayload } from '../features/repairShops/types'

const BASE_PATH = '/api/v1/admin/repairshops'

export const repairShopsApi = {
  getAll() {
    return adminApiClient.get<RepairShop[]>(BASE_PATH).then((res) => res.data)
  },
  getById(id: string) {
    return adminApiClient.get<RepairShop>(`${BASE_PATH}/${id}`).then((res) => res.data)
  },
  create(payload: RepairShopPayload) {
    return adminApiClient.post<RepairShop>(BASE_PATH, payload).then((res) => res.data)
  },
  update(id: string, payload: RepairShopPayload) {
    return adminApiClient.put<RepairShop>(`${BASE_PATH}/${id}`, payload).then((res) => res.data)
  },
}
