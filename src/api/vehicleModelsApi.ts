import { apiClient } from './apiClient'
import type { VehicleModel } from '../features/vehicleModels/types'

const BASE_PATH = '/api/v1/general/vehiclemodels'

export const vehicleModelsApi = {
  getByBrand(brandId: string) {
    return apiClient.get<VehicleModel[]>(BASE_PATH, { params: { brandId } }).then((res) => res.data)
  },
  create(brandId: string, name: string) {
    return apiClient.post<VehicleModel>(BASE_PATH, { brandId, name }).then((res) => res.data)
  },
}
