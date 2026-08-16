import { apiClient } from './apiClient'
import type { CreateJobPayload, Job, UpdateJobPayload } from '../features/jobs/types'

const BASE_PATH = '/api/v1/general/jobs'

export const jobsApi = {
  getAll(from: string, to: string) {
    return apiClient.get<Job[]>(BASE_PATH, { params: { from, to } }).then((res) => res.data)
  },

  create(payload: CreateJobPayload) {
    return apiClient.post<Job>(BASE_PATH, payload).then((res) => res.data)
  },

  update(id: string, payload: UpdateJobPayload) {
    return apiClient.put<Job>(`${BASE_PATH}/${id}`, payload).then((res) => res.data)
  },

  delete(id: string) {
    return apiClient.delete<void>(`${BASE_PATH}/${id}`).then((res) => res.data)
  },
}
