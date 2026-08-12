import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../features/auth/authSlice'
import jobsUiReducer from '../features/jobs/jobsUiSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    jobsUi: jobsUiReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
