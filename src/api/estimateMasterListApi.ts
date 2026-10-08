import { apiClient } from './apiClient'

const BASE_PATH = '/api/v1/general/estimatemasterlist'

export interface EstimateMasterListItem {
  id: string
  name: string
  hours: number | null
  priceHr: number | null
  total: number | null
}

export interface EstimateMasterListInput {
  name: string
  hours?: number | null
  priceHr?: number | null
  total?: number | null
}

export interface EstimateMasterListPageParams {
  search: string
  /** 1-based. */
  page: number
  pageSize: number
}

export interface EstimateMasterListPage {
  items: EstimateMasterListItem[]
  totalCount: number
  /** The page actually returned (1-based); the server moves a request past the last page back to the last page. */
  page: number
  pageSize: number
}

export const estimateMasterListApi = {
  /** The whole catalog, for pickers. */
  getAll() {
    return apiClient.get<EstimateMasterListItem[]>(BASE_PATH).then((res) => res.data)
  },

  /** One page of the catalog, filtered by name on the server. */
  getPage(params: EstimateMasterListPageParams) {
    return apiClient.get<EstimateMasterListPage>(`${BASE_PATH}/page`, { params }).then((res) => res.data)
  },

  create(input: EstimateMasterListInput) {
    return apiClient.post<EstimateMasterListItem>(BASE_PATH, input).then((res) => res.data)
  },

  update(id: string, input: Required<EstimateMasterListInput>) {
    return apiClient.put<EstimateMasterListItem>(`${BASE_PATH}/${id}`, input).then((res) => res.data)
  },

  /** Soft delete: work already using the item keeps it, but it is no longer listed. */
  remove(id: string) {
    return apiClient.delete(`${BASE_PATH}/${id}`).then(() => undefined)
  },
}
