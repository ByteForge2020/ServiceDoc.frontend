import { useQuery } from '@tanstack/react-query'
import { shopApi } from './shopApi'

export function useShopSettingsQuery() {
  return useQuery({
    queryKey: ['shopSettings'],
    queryFn: shopApi.getSettings,
  })
}
