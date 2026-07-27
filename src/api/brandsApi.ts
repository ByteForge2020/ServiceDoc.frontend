import { apiClient } from './apiClient'
import type { Brand } from '../features/brands/types'

const BASE_PATH = '/api/v1/general/brands'

export const brandsApi = {
  getAll() {
    return apiClient.get<Brand[]>(BASE_PATH).then((res) => res.data)
  },
  create(name: string) {
    return apiClient.post<Brand>(BASE_PATH, { name }).then((res) => res.data)
  },
}
