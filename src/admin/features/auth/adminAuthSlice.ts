import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import axios, { AxiosError } from 'axios'
import { extractErrorMessage } from '../../api/errorMessage'
import { adminCredentialsStorage } from './adminCredentialsStorage'

export interface AdminAuthState {
  credentials: string | null
  status: 'idle' | 'loading'
}

const initialState: AdminAuthState = {
  credentials: adminCredentialsStorage.get(),
  status: 'idle',
}

export interface AdminLoginRequest {
  username: string
  password: string
}

export const adminLogin = createAsyncThunk<string, AdminLoginRequest, { rejectValue: string }>(
  'adminAuth/login',
  async ({ username, password }, { rejectWithValue }) => {
    const credentials = btoa(`${username}:${password}`)

    try {
      await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/repairshops`, {
        headers: { Authorization: `Basic ${credentials}` },
      })
      return credentials
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 401) {
        return rejectWithValue('Invalid username or password')
      }
      return rejectWithValue(extractErrorMessage(error, 'Invalid username or password'))
    }
  },
)

const adminAuthSlice = createSlice({
  name: 'adminAuth',
  initialState,
  reducers: {
    adminLogout(state) {
      state.credentials = null
      adminCredentialsStorage.clear()
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(adminLogin.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(adminLogin.fulfilled, (state, action: PayloadAction<string>) => {
        state.status = 'idle'
        state.credentials = action.payload
        adminCredentialsStorage.set(action.payload)
      })
      .addCase(adminLogin.rejected, (state) => {
        state.status = 'idle'
      })
  },
})

export const { adminLogout } = adminAuthSlice.actions
export default adminAuthSlice.reducer
