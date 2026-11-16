import { describe, expect, it } from 'vitest';
import reducer, { setSidebarOpen, toggleTheme } from './uiSlice';

describe('ui slice', () => {
  it('toggles the theme between light and dark', () => {
    const start = { theme: 'light', sidebarOpen: false };
    const dark = reducer(start, toggleTheme());
    expect(dark.theme).toBe('dark');
    expect(reducer(dark, toggleTheme()).theme).toBe('light');
  });

  it('sets the mobile sidebar open state', () => {
    const opened = reducer({ theme: 'light', sidebarOpen: false }, setSidebarOpen(true));
    expect(opened.sidebarOpen).toBe(true);
  });
});
