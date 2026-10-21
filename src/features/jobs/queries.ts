import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { jobsApi } from '../../api/jobsApi'
import type { CreateJobPayload, Job, RescheduleJobPayload, UpdateJobPayload } from './types'

export const jobsKeys = {
  range: (from: string, to: string) => ['jobs', from, to] as const,
}

export function useJobsQuery(from: string, to: string) {
  return useQuery({
    queryKey: jobsKeys.range(from, to),
    queryFn: () => jobsApi.getAll(from, to),
    // Keeps the grid mounted while the date changes mid-drag.
    placeholderData: keepPreviousData,
  })
}

interface RescheduleJobVariables extends RescheduleJobPayload {
  id: string
  assignedUserName: string
}

export function useRescheduleJobMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, assignedUserId, scheduledTime }: RescheduleJobVariables) =>
      jobsApi.reschedule(id, { assignedUserId, scheduledTime }),
    onMutate: async ({ id, assignedUserId, assignedUserName, scheduledTime }) => {
      await queryClient.cancelQueries({ queryKey: ['jobs'] })
      const previous = queryClient.getQueriesData<Job[]>({ queryKey: ['jobs'] })

      queryClient.setQueriesData<Job[]>({ queryKey: ['jobs'] }, (jobs) =>
        jobs?.map((job) => (job.id === id ? { ...job, assignedUserId, assignedUserName, scheduledTime } : job)),
      )

      return { previous }
    },
    onError: (_error, _variables, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data))
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    },
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
