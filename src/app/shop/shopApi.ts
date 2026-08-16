import { apiClient } from '../../api/apiClient'

export interface ShopSettings {
  timeZoneIana: string
}

export const shopApi = {
  getSettings() {
    return apiClient.get<ShopSettings>('/api/v1/general/shop').then((res) => res.data)
  },
}
