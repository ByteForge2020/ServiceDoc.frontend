import { apiClient } from './apiClient'
import type { CustomerSearchResult } from '../features/customers/types'

const BASE_PATH = '/api/v1/general/customers'

export const customersApi = {
  search(query: string) {
    return apiClient
      .get<CustomerSearchResult[]>(`${BASE_PATH}/search`, { params: { query } })
      .then((res) => res.data)
  },
}
