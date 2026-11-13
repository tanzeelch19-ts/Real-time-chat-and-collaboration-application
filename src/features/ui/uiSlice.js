import { createSlice } from '@reduxjs/toolkit';

export const THEME_KEY = 'chat.theme';
export const DENSITY_KEY = 'chat.density';
export const FONT_KEY = 'chat.fontSize';

const DENSITIES = ['comfortable', 'compact'];
const FONT_SIZES = ['normal', 'large'];

/** Reads the saved theme, falling back to the OS preference. Storage can be unavailable. */
function getInitialTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // Storage unavailable; fall through to the system preference.
  }
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches;
  return prefersDark ? 'dark' : 'light';
}

function readChoice(key, allowed, fallback) {
  try {
    const saved = localStorage.getItem(key);
    if (allowed.includes(saved)) return saved;
  } catch {
    // Storage unavailable; use the default.
  }
  return fallback;
}

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    theme: getInitialTheme(),
    sidebarOpen: false,
    density: readChoice(DENSITY_KEY, DENSITIES, 'comfortable'),
    fontSize: readChoice(FONT_KEY, FONT_SIZES, 'normal'),
  },
  reducers: {
    toggleTheme(state) {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
    },
    setSidebarOpen(state, action) {
      state.sidebarOpen = action.payload;
    },
    setDensity(state, action) {
      if (DENSITIES.includes(action.payload)) state.density = action.payload;
    },
    setFontSize(state, action) {
      if (FONT_SIZES.includes(action.payload)) state.fontSize = action.payload;
    },
  },
});

export const { toggleTheme, setSidebarOpen, setDensity, setFontSize } = uiSlice.actions;

export const selectTheme = (state) => state.ui.theme;
export const selectSidebarOpen = (state) => state.ui.sidebarOpen;
export const selectDensity = (state) => state.ui.density;
export const selectFontSize = (state) => state.ui.fontSize;

export default uiSlice.reducer;