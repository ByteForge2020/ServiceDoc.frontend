import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { store } from '../app/store'
import { logout, refreshAccessToken } from '../features/auth/authSlice'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const { accessToken } = store.getState().auth
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`)
  }
  return config
})

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

// Concurrent 401s share a single in-flight refresh call instead of each firing their own.
let refreshPromise: Promise<string> | null = null

function refreshAndGetAccessToken(): Promise<string> {
  refreshPromise ??= store
    .dispatch(refreshAccessToken())
    .unwrap()
    .then((tokens) => tokens.accessToken)
    .finally(() => {
      refreshPromise = null
    })

  return refreshPromise
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    try {
      const accessToken = await refreshAndGetAccessToken()
      originalRequest.headers.set('Authorization', `Bearer ${accessToken}`)
      return apiClient(originalRequest)
    } catch (refreshError) {
      store.dispatch(logout())
      return Promise.reject(refreshError)
    }
  },
)
