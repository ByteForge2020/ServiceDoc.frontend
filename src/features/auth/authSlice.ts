import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { authApi } from '../../api/authApi'
import { extractErrorMessage } from '../../api/errorMessage'
import { buildUserFromToken } from './decodeUser'
import { tokenStorage } from './tokenStorage'
import type { AuthUser, LoginRequest, TokenResponse } from './types'

export interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: AuthUser | null
  status: 'idle' | 'loading'
}

const storedAccessToken = tokenStorage.getAccessToken()

const initialState: AuthState = {
  accessToken: storedAccessToken,
  refreshToken: tokenStorage.getRefreshToken(),
  user: storedAccessToken ? buildUserFromToken(storedAccessToken) : null,
  status: 'idle',
}

function applyTokens(state: AuthState, tokens: TokenResponse): void {
  state.accessToken = tokens.accessToken
  state.refreshToken = tokens.refreshToken
  state.user = buildUserFromToken(tokens.accessToken)
  tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken)
}

function clearSession(state: AuthState): void {
  state.accessToken = null
  state.refreshToken = null
  state.user = null
  tokenStorage.clear()
}

export const login = createAsyncThunk<TokenResponse, LoginRequest, { rejectValue: string }>(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      return await authApi.login(credentials)
    } catch (error) {
      return rejectWithValue(extractErrorMessage(error, 'Invalid email or password.'))
    }
  },
)

export const refreshAccessToken = createAsyncThunk<
  TokenResponse,
  void,
  { state: { auth: AuthState }; rejectValue: string }
>('auth/refresh', async (_, { getState, rejectWithValue }) => {
  const { refreshToken } = getState().auth
  if (!refreshToken) {
    return rejectWithValue('No refresh token available.')
  }
  try {
    return await authApi.refresh(refreshToken)
  } catch (error) {
    return rejectWithValue(extractErrorMessage(error, 'Session expired.'))
  }
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.status = 'idle'
      clearSession(state)
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<TokenResponse>) => {
        state.status = 'idle'
        applyTokens(state, action.payload)
      })
      .addCase(login.rejected, (state) => {
        state.status = 'idle'
      })
      .addCase(refreshAccessToken.fulfilled, (state, action: PayloadAction<TokenResponse>) => {
        applyTokens(state, action.payload)
      })
      .addCase(refreshAccessToken.rejected, (state) => {
        clearSession(state)
      })
  },
})

export const { logout } = authSlice.actions
export default authSlice.reducer
