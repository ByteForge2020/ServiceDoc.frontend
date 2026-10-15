import { apiClient } from '../../api/apiClient'

/** How an estimate item's Discount is read: a percent of its amount, or a fixed money amount. */
export type DiscountType = 'Percent' | 'Fixed'

export interface ShopSettings {
  timeZoneIana: string
  /** When on, new estimate items get their tax calculated from their total at `taxPercent`. */
  priceIncludesTax: boolean
  /** 1-99. Kept while `priceIncludesTax` is off. */
  taxPercent: number | null
  /** Given to work orders created from now on; existing orders keep theirs. */
  discountType: DiscountType
}

export interface WorkOrderSettings {
  discountType: DiscountType
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

  updateWorkOrderSettings(settings: WorkOrderSettings) {
    return apiClient.put<ShopSettings>('/api/v1/general/shop/work-order-settings', settings).then((res) => res.data)
  },
}
