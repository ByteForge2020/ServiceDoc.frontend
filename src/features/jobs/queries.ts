import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { jobsApi } from '../../api/jobsApi'
import type { CreateJobPayload } from './types'

export const jobsKeys = {
  range: (from: string, to: string) => ['jobs', from, to] as const,
}

export function useJobsQuery(from: string, to: string) {
  return useQuery({
    queryKey: jobsKeys.range(from, to),
    queryFn: () => jobsApi.getAll(from, to),
  })
}

export function useCreateJobMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateJobPayload) => jobsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    },
  })
}
