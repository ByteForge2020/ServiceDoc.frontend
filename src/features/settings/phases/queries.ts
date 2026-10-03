import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { phasesApi, type Phase } from '../../../api/phasesApi'
import { workOrderKeys } from '../../workOrders/queries'

export const phaseKeys = {
  all: ['phases'] as const,
}

export function usePhasesQuery() {
  return useQuery({
    queryKey: phaseKeys.all,
    queryFn: phasesApi.getAll,
  })
}

export function useCreatePhaseMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (name: string) => phasesApi.create(name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: phaseKeys.all }),
  })
}

export function useRenamePhaseMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => phasesApi.rename(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: phaseKeys.all })
      queryClient.invalidateQueries({ queryKey: workOrderKeys.all })
    },
  })
}

export function useDeletePhaseMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => phasesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: phaseKeys.all })
      // Orders that were in the deleted phase are moved to "No phase" by the server.
      queryClient.invalidateQueries({ queryKey: workOrderKeys.all })
    },
  })
}

export function useReorderPhasesMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (customPhaseIds: string[]) => phasesApi.reorder(customPhaseIds),
    // Optimistic: show the new order immediately and roll back if the server rejects it.
    onMutate: async (customPhaseIds) => {
      await queryClient.cancelQueries({ queryKey: phaseKeys.all })
      const previous = queryClient.getQueryData<Phase[]>(phaseKeys.all)

      if (previous) {
        const custom = customPhaseIds
          .map((id) => previous.find((phase) => phase.id === id))
          .filter((phase): phase is Phase => phase !== undefined)

        queryClient.setQueryData<Phase[]>(phaseKeys.all, [
          ...previous.filter((phase) => phase.systemType === 'NoPhase'),
          ...custom,
          ...previous.filter((phase) => phase.systemType === 'Closed'),
        ])
      }

      return { previous }
    },
    onError: (_error, _ids, context) => {
      if (context?.previous) {
        queryClient.setQueryData(phaseKeys.all, context.previous)
      }
    },
    onSuccess: (phases) => queryClient.setQueryData(phaseKeys.all, phases),
  })
}
