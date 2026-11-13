import { configureStore } from '@reduxjs/toolkit';
import uiReducer from '@/features/ui/uiSlice';
import authReducer, { sessionExpired } from '@/features/auth/authSlice';
import presenceReducer from '@/features/presence/presenceSlice';
import draftsReducer from '@/features/messages/draftsSlice';
import { setUnauthorizedHandler } from '@/services/api/client';
import { clearAccessToken } from '@/services/api/tokenStorage';

/**
 * Client-only state lives here. Server data (messages, channels, members)
 * is owned by TanStack Query, not Redux.
 */
export const store = configureStore({
  reducer: {
    ui: uiReducer,
    auth: authReducer,
    presence: presenceReducer,
    drafts: draftsReducer,
  },
});

// Any 401 from a protected request signs the user out across the app.
setUnauthorizedHandler(() => {
  clearAccessToken();
  store.dispatch(sessionExpired());
});