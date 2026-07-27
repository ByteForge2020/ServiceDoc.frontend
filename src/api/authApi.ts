import { publicClient } from './publicClient'
import type { LoginRequest, TokenResponse } from '../features/auth/types'

export const authApi = {
  login(payload: LoginRequest) {
    return publicClient.post<TokenResponse>('/api/v1/keycloak/login', payload).then((res) => res.data)
  },

  refresh(refreshToken: string) {
    return publicClient
      .post<TokenResponse>('/api/v1/keycloak/refresh-token', { refreshToken })
      .then((res) => res.data)
  },
}
