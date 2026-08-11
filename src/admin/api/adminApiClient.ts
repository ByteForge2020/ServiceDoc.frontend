import axios from 'axios'
import { adminStore } from '../app/adminStore'
import { adminLogout } from '../features/auth/adminAuthSlice'

export const adminApiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

adminApiClient.interceptors.request.use((config) => {
  const { credentials } = adminStore.getState().adminAuth
  if (credentials) {
    config.headers.set('Authorization', `Basic ${credentials}`)
  }
  return config
})

adminApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      adminStore.dispatch(adminLogout())
    }
    return Promise.reject(error)
  },
)
