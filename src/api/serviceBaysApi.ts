import { apiClient } from './apiClient'

const BASE_PATH = '/api/v1/general/servicebays'

export interface ServiceBay {
  id: string
  name: string
}

export const serviceBaysApi = {
  getAll() {
    return apiClient.get<ServiceBay[]>(BASE_PATH).then((res) => res.data)
  },

  create(name: string) {
    return apiClient.post<ServiceBay>(BASE_PATH, { name }).then((res) => res.data)
  },

  rename(id: string, name: string) {
    return apiClient.put<ServiceBay>(`${BASE_PATH}/${id}`, { name }).then((res) => res.data)
  },

  remove(id: string) {
    return apiClient.delete(`${BASE_PATH}/${id}`).then(() => undefined)
  },
}
