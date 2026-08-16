import { adminApiClient } from './adminApiClient'

export interface TimeZoneOption {
  id: string
  name: string
  ianaTz: string
}

const BASE_PATH = '/api/v1/admin/timezones'

export const timeZonesApi = {
  getAll() {
    return adminApiClient.get<TimeZoneOption[]>(BASE_PATH).then((res) => res.data)
  },
}
