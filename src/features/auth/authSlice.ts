import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { authApi } from '../../api/authApi'
import { extractErrorMessage } from '../../api/errorMessage'
import i18n from '../../i18n'
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
      return rejectWithValue(extractErrorMessage(error, i18n.t('auth.invalidCredentials')))
    }
  },
)

export const refreshAccessToken = createAsyncThunk<
  TokenResponse,
  void,
  { state: { auth: AuthState }; rejectValue: string }
>('auth/refresh', async (_, { getState, rejectWithValue }) => {
  // Every refresh replaces the refresh token, and all tabs share the stored one: another tab may already have
  // refreshed, in which case its token is the current one.
  const refreshToken = tokenStorage.getRefreshToken() ?? getState().auth.refreshToken
  if (!refreshToken) {
    return rejectWithValue(i18n.t('auth.noRefreshToken'))
  }
  try {
    return await authApi.refresh(refreshToken)
  } catch (error) {
    // Two tabs refreshing at the same moment: this one lost, and the other's new tokens are (about to be) stored.
    await new Promise((resolve) => setTimeout(resolve, 300))
    const storedAccessToken = tokenStorage.getAccessToken()
    const storedRefreshToken = tokenStorage.getRefreshToken()

    if (storedAccessToken && storedRefreshToken && storedRefreshToken !== refreshToken) {
      return { accessToken: storedAccessToken, refreshToken: storedRefreshToken, expiresIn: 0, tokenType: 'Bearer' }
    }

    return rejectWithValue(extractErrorMessage(error, i18n.t('auth.sessionExpired')))
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

/** Signs out here at once, then revokes the session on the server (best effort: it is gone locally either way). */
export const signOut = createAsyncThunk<void, void, { state: { auth: AuthState } }>(
  'auth/signOut',
  async (_, { getState, dispatch }) => {
    const { refreshToken } = getState().auth
    dispatch(logout())

    if (!refreshToken) {
      return
    }

    try {
      await authApi.logout(refreshToken)
    } catch {
      // Nothing to do: the tokens were already dropped from this browser.
    }
  },
)
export default authSlice.reducer
