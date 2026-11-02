import { publicClient } from './publicClient'
import type { LoginRequest, TokenResponse } from '../features/auth/types'

export const authApi = {
  login(payload: LoginRequest) {
    return publicClient.post<TokenResponse>('/api/v1/auth/login', payload).then((res) => res.data)
  },

  refresh(refreshToken: string) {
    return publicClient
      .post<TokenResponse>('/api/v1/auth/refresh-token', { refreshToken })
      .then((res) => res.data)
  },

  /** Ends the session on the server by revoking the refresh token. */
  logout(refreshToken: string) {
    return publicClient.post<void>('/api/v1/auth/logout', { refreshToken }).then((res) => res.data)
  },
}
