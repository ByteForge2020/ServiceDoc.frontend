import { configureStore } from '@reduxjs/toolkit'
import adminAuthReducer from '../features/auth/adminAuthSlice'

export const adminStore = configureStore({
  reducer: {
    adminAuth: adminAuthReducer,
  },
})

export type AdminRootState = ReturnType<typeof adminStore.getState>
export type AdminAppDispatch = typeof adminStore.dispatch
