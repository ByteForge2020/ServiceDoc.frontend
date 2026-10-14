import { apiClient } from '../../api/apiClient'

export interface ShopSettings {
  timeZoneIana: string
  /** When on, new estimate items get their tax calculated from their total at `taxPercent`. */
  priceIncludesTax: boolean
  /** 1-99. Kept while `priceIncludesTax` is off. */
  taxPercent: number | null
}

export interface TaxSettings {
  priceIncludesTax: boolean
  taxPercent: number | null
}

export const shopApi = {
  getSettings() {
    return apiClient.get<ShopSettings>('/api/v1/general/shop').then((res) => res.data)
  },

  updateTaxSettings(settings: TaxSettings) {
    return apiClient.put<ShopSettings>('/api/v1/general/shop/tax-settings', settings).then((res) => res.data)
  },
}
