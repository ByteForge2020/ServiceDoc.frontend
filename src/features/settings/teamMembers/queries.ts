import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { teamMembersApi } from '../../../api/teamMembersApi'
import type { CreateTeamMemberPayload, UpdateTeamMemberPayload } from './types'

export const teamMemberKeys = {
  all: ['teamMembers'] as const,
  detail: (id: string) => ['teamMembers', id] as const,
}

export function useTeamMembersQuery() {
  return useQuery({
    queryKey: teamMemberKeys.all,
    queryFn: teamMembersApi.getAll,
  })
}

export function useTeamMemberQuery(id: string | undefined) {
  return useQuery({
    queryKey: teamMemberKeys.detail(id ?? ''),
    queryFn: () => teamMembersApi.getById(id!),
    enabled: !!id,
  })
}

export function useCreateTeamMemberMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateTeamMemberPayload) => teamMembersApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamMemberKeys.all })
    },
  })
}

export function useUpdateTeamMemberMutation(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateTeamMemberPayload) => teamMembersApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamMemberKeys.all })
      queryClient.invalidateQueries({ queryKey: teamMemberKeys.detail(id) })
    },
  })
}
