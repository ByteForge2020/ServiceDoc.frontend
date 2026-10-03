import { apiClient } from './apiClient'

const BASE_PATH = '/api/v1/general/phases'

// 'NoPhase' and 'Closed' are the two default phases every shop has; everything else is 'None' (a custom phase).
export type PhaseSystemType = 'None' | 'NoPhase' | 'Closed'

export interface Phase {
  id: string
  name: string
  systemType: PhaseSystemType
}

export const phasesApi = {
  getAll() {
    return apiClient.get<Phase[]>(BASE_PATH).then((res) => res.data)
  },

  create(name: string) {
    return apiClient.post<Phase>(BASE_PATH, { name }).then((res) => res.data)
  },

  rename(id: string, name: string) {
    return apiClient.put<Phase>(`${BASE_PATH}/${id}`, { name }).then((res) => res.data)
  },

  remove(id: string) {
    return apiClient.delete(`${BASE_PATH}/${id}`).then(() => undefined)
  },

  /** Sets the order of the custom phases; the response is the full list (default phases included). */
  reorder(phaseIds: string[]) {
    return apiClient.put<Phase[]>(`${BASE_PATH}/order`, { phaseIds }).then((res) => res.data)
  },
}
