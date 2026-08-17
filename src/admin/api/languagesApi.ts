import { adminApiClient } from './adminApiClient'

export interface LanguageOption {
  id: string
  name: string
  code: string
}

const BASE_PATH = '/api/v1/admin/languages'

export const languagesApi = {
  getAll() {
    return adminApiClient.get<LanguageOption[]>(BASE_PATH).then((res) => res.data)
  },
}
