import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  estimateMasterListApi,
  type EstimateMasterListInput,
  type EstimateMasterListPageParams,
} from '../../api/estimateMasterListApi'
import { appointmentKeys } from '../appointments/queries'

// The callers show their own, specific error toast (e.g. "an item with this name already exists"), so the global
// MutationCache toast is skipped; otherwise two toasts are raised at once.
const SKIP_ERROR_TOAST = { skipErrorToast: true }

export const estimateMasterListKeys = {
  all: ['estimateMasterList'] as const,
  items: ['estimateMasterList', 'items'] as const,
  page: (params: EstimateMasterListPageParams) => ['estimateMasterList', 'page', params] as const,
}

export function useEstimateMasterListItemsQuery() {
  return useQuery({
    queryKey: estimateMasterListKeys.items,
    queryFn: estimateMasterListApi.getAll,
    staleTime: 5 * 60_000,
  })
}

export function useEstimateMasterListPageQuery(params: EstimateMasterListPageParams) {
  return useQuery({
    queryKey: estimateMasterListKeys.page(params),
    queryFn: () => estimateMasterListApi.getPage(params),
    // Keep showing the current rows while the next page or search result loads.
    placeholderData: keepPreviousData,
  })
}

export function useCreateEstimateMasterListItemMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: EstimateMasterListInput) => estimateMasterListApi.create(input),
    meta: SKIP_ERROR_TOAST,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: estimateMasterListKeys.all })
    },
  })
}

export function useUpdateEstimateMasterListItemMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Required<EstimateMasterListInput> }) =>
      estimateMasterListApi.update(id, input),
    meta: SKIP_ERROR_TOAST,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: estimateMasterListKeys.all })
      // Appointments list their reasons by the item's current name.
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all })
    },
  })
}

export function useDeleteEstimateMasterListItemMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => estimateMasterListApi.remove(id),
    meta: SKIP_ERROR_TOAST,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: estimateMasterListKeys.all })
    },
  })
}
