import { createSlice } from '@reduxjs/toolkit';

const NONE = [];

/**
 * Who is online and who is away. Filled by presence:snapshot and updated by presence:update.
 * A user in awayIds is also in onlineIds, because away means connected but idle.
 */
const presenceSlice = createSlice({
  name: 'presence',
  initialState: { onlineIds: NONE, awayIds: NONE },
  reducers: {
    presenceSnapshot(state, action) {
      state.onlineIds = action.payload.userIds ?? NONE;
      state.awayIds = action.payload.awayIds ?? NONE;
    },
    presenceChanged(state, action) {
      const { userId, online, away = false } = action.payload;
      const onlineIds = state.onlineIds.filter((id) => id !== userId);
      const awayIds = state.awayIds.filter((id) => id !== userId);
      if (online) {
        onlineIds.push(userId);
        if (away) awayIds.push(userId);
      }
      state.onlineIds = onlineIds;
      state.awayIds = awayIds;
    },
  },
});

export const { presenceSnapshot, presenceChanged } = presenceSlice.actions;

export const selectOnlineIds = (state) => state.presence?.onlineIds ?? NONE;
export const selectAwayIds = (state) => state.presence?.awayIds ?? NONE;

/** 'online', 'away', or 'offline' for one user. */
export const selectPresenceStatus = (userId) => (state) => {
  if (selectAwayIds(state).includes(userId)) return 'away';
  if (selectOnlineIds(state).includes(userId)) return 'online';
  return 'offline';
};

export const selectIsOnline = (userId) => (state) => selectPresenceStatus(userId)(state) !== 'offline';

export default presenceSlice.reducer;