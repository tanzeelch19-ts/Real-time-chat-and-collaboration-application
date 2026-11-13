import { describe, expect, it } from 'vitest';
import reducer, { setDensity, setFontSize } from '@/features/ui/uiSlice';

describe('appearance settings', () => {
  const start = { theme: 'light', sidebarOpen: false, density: 'comfortable', fontSize: 'normal' };

  it('switches density and ignores unknown values', () => {
    expect(reducer(start, setDensity('compact')).density).toBe('compact');
    expect(reducer(start, setDensity('huge')).density).toBe('comfortable');
  });

  it('switches text size and ignores unknown values', () => {
    expect(reducer(start, setFontSize('large')).fontSize).toBe('large');
    expect(reducer(start, setFontSize('tiny')).fontSize).toBe('normal');
  });
});