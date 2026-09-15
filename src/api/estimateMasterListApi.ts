import { apiClient } from './apiClient'

const BASE_PATH = '/api/v1/general/estimatemasterlist'

export interface EstimateMasterListItem {
  id: string
  name: string
  isDefault: boolean
}

export const estimateMasterListApi = {
  getAll() {
    return apiClient.get<EstimateMasterListItem[]>(BASE_PATH).then((res) => res.data)
  },

  create(name: string) {
    return apiClient.post<EstimateMasterListItem>(BASE_PATH, { name }).then((res) => res.data)
  },
}
