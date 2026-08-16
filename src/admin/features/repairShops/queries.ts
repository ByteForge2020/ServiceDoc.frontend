import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { repairShopsApi } from '../../api/repairShopsApi'
import { timeZonesApi } from '../../api/timeZonesApi'
import type { RepairShopPayload } from './types'

export const repairShopKeys = {
  all: ['repairShops'] as const,
  detail: (id: string) => ['repairShops', id] as const,
}

export function useTimeZonesQuery() {
  return useQuery({
    queryKey: ['timeZones'],
    queryFn: timeZonesApi.getAll,
  })
}

export function useRepairShopsQuery() {
  return useQuery({
    queryKey: repairShopKeys.all,
    queryFn: repairShopsApi.getAll,
  })
}

export function useRepairShopQuery(id: string | undefined) {
  return useQuery({
    queryKey: repairShopKeys.detail(id ?? ''),
    queryFn: () => repairShopsApi.getById(id!),
    enabled: !!id,
  })
}

export function useCreateRepairShopMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: RepairShopPayload) => repairShopsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: repairShopKeys.all })
    },
  })
}

export function useUpdateRepairShopMutation(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: RepairShopPayload) => repairShopsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: repairShopKeys.all })
      queryClient.invalidateQueries({ queryKey: repairShopKeys.detail(id) })
    },
  })
}
