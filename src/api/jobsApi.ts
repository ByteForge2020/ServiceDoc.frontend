import { apiClient } from './apiClient'
import type { CreateJobPayload, Job } from '../features/jobs/types'

const BASE_PATH = '/api/v1/general/jobs'

export const jobsApi = {
  getAll(from: string, to: string) {
    return apiClient.get<Job[]>(BASE_PATH, { params: { from, to } }).then((res) => res.data)
  },

  create(payload: CreateJobPayload) {
    return apiClient.post<Job>(BASE_PATH, payload).then((res) => res.data)
  },
}
