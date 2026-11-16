import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { authApi } from '@/features/auth/authApi';
import { toSerializableError } from '@/services/api/errors';
import { clearAccessToken, getAccessToken, setAccessToken } from '@/services/api/tokenStorage';

/**
 * Wraps a payload creator so failures are rejected with a plain, serializable object.
 */
function createAuthThunk(type, payloadCreator) {
  return createAsyncThunk(type, async (arg, { rejectWithValue }) => {
    try {
      return await payloadCreator(arg);
    } catch (error) {
      return rejectWithValue(toSerializableError(error));
    }
  });
}

/** Resolves to the user, or null when there is no usable session. */
export const loadSession = createAsyncThunk('auth/loadSession', async () => {
  if (!getAccessToken()) return null;
  try {
    return await authApi.fetchCurrentUser();
  } catch {
    // A rejected token (401) has already triggered sessionExpired via the client.
    clearAccessToken();
    return null;
  }
});

export const loginUser = createAuthThunk('auth/login', async (credentials) => {
  const { user, accessToken } = await authApi.login(credentials);
  setAccessToken(accessToken);
  return user;
});

export const registerUser = createAuthThunk('auth/register', async (values) => {
  const { user, accessToken } = await authApi.register(values);
  setAccessToken(accessToken);
  return user;
});

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  try {
    await authApi.logout();
  } catch {
    // The server session may already be gone. Sign out locally regardless.
  } finally {
    clearAccessToken();
  }
});

export const updateProfile = createAuthThunk('auth/updateProfile', (patch) =>
  authApi.updateCurrentUser(patch),
);

/** Rejected actions carry the error in `payload`; fall back to `error.message` otherwise. */
const rejectionPayload = (action) =>
  action.payload ?? { message: action.error?.message ?? 'Something went wrong.', details: [] };

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    status: 'idle', // idle | checking | authenticated | anonymous
    user: null,
    error: null,
    sessionExpiredReason: null,
  },
  reducers: {
    sessionExpired(state) {
      state.status = 'anonymous';
      state.user = null;
      state.sessionExpiredReason = 'expired';
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadSession.pending, (state) => {
        if (state.status === 'idle') state.status = 'checking';
      })
      .addCase(loadSession.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = action.payload ? 'authenticated' : 'anonymous';
      })

      .addCase(loginUser.pending, (state) => {
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'authenticated';
        state.user = action.payload;
        state.error = null;
        state.sessionExpiredReason = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.error = rejectionPayload(action);
      })

      .addCase(registerUser.pending, (state) => {
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.status = 'authenticated';
        state.user = action.payload;
        state.error = null;
        state.sessionExpiredReason = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.error = rejectionPayload(action);
      })

      .addCase(logoutUser.fulfilled, (state) => {
        state.status = 'anonymous';
        state.user = null;
        state.error = null;
        state.sessionExpiredReason = null;
      })

      .addCase(updateProfile.pending, (state) => {
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.error = rejectionPayload(action);
      });
  },
});

export const { sessionExpired, clearAuthError } = authSlice.actions;

export const selectAuthStatus = (state) => state.auth.status;
export const selectCurrentUser = (state) => state.auth.user;
export const selectAuthError = (state) => state.auth.error;
export const selectSessionExpiredReason = (state) => state.auth.sessionExpiredReason;
export const selectIsAuthenticated = (state) => state.auth.status === 'authenticated';

export default authSlice.reducer;
