import { apiClient } from './apiClient'

const BASE_PATH = '/api/v1/general/shop/location'

/** The shop's own details; a value that was never set (or was cleared) is null. */
export interface LocationInfo {
  address: string | null
  phone: string | null
  legalName: string | null
  taxId: string | null
}

export const shopLocationApi = {
  getLocation() {
    return apiClient.get<LocationInfo>(BASE_PATH).then((res) => res.data)
  },

  updateLocation(request: LocationInfo) {
    return apiClient.put<LocationInfo>(BASE_PATH, request).then((res) => res.data)
  },
}
