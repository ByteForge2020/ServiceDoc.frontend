import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { shopApi, type TaxSettings, type WorkOrderSettings } from './shopApi'

const shopSettingsKey = ['shopSettings'] as const

export function useShopSettingsQuery() {
  return useQuery({
    queryKey: shopSettingsKey,
    queryFn: shopApi.getSettings,
  })
}

export function useUpdateTaxSettingsMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (settings: TaxSettings) => shopApi.updateTaxSettings(settings),
    meta: { skipErrorToast: true },
    // The response is the full shop settings, so everything reading them (work orders included) updates at once.
    onSuccess: (data) => queryClient.setQueryData(shopSettingsKey, data),
  })
}

export function useUpdateWorkOrderSettingsMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (settings: WorkOrderSettings) => shopApi.updateWorkOrderSettings(settings),
    meta: { skipErrorToast: true },
    onSuccess: (data) => queryClient.setQueryData(shopSettingsKey, data),
  })
}
