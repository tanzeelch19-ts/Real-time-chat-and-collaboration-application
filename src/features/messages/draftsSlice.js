import { createSlice } from '@reduxjs/toolkit';

/**
 * Unsent message text, keyed by room id. Kept in Redux so a draft survives switching
 * workspaces, channels, and conversations during the session.
 */
const draftsSlice = createSlice({
  name: 'drafts',
  initialState: { byRoom: {} },
  reducers: {
    setDraft(state, action) {
      const { roomId, text } = action.payload;
      if (text) state.byRoom[roomId] = text;
      else delete state.byRoom[roomId];
    },
    clearDraft(state, action) {
      delete state.byRoom[action.payload];
    },
  },
});

export const { setDraft, clearDraft } = draftsSlice.actions;

export const selectDraft = (roomId) => (state) => state.drafts?.byRoom?.[roomId] ?? '';

export default draftsSlice.reducer;