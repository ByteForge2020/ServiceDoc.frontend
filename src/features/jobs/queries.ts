import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { jobsApi } from '../../api/jobsApi'
import type { CreateJobPayload, UpdateJobPayload } from './types'

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

export function useUpdateJobMutation(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateJobPayload) => jobsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    },
  })
}

export function useDeleteJobMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => jobsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    },
  })
}
