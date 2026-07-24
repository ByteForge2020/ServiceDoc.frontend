import { apiClient } from './apiClient'
import type { Vehicle } from '../features/vehicles/types'

const BASE_PATH = '/api/general/vehicles'

export const vehiclesApi = {
  getByCustomer(customerId: string) {
    return apiClient.get<Vehicle[]>(BASE_PATH, { params: { customerId } }).then((res) => res.data)
  },
}
