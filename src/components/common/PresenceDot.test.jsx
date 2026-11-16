import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PresenceDot from '@/components/common/PresenceDot';
import { renderWithProviders } from '@/test/renderWithProviders';

describe('PresenceDot', () => {
  it('shows online for users in the presence list', () => {
    renderWithProviders(<PresenceDot userId="u1" />, {
      preloadedState: { presence: { onlineIds: ['u1'] } },
    });
    expect(screen.getByRole('img', { name: 'Online' })).toBeInTheDocument();
  });

  it('shows offline for everyone else', () => {
    renderWithProviders(<PresenceDot userId="u2" />, {
      preloadedState: { presence: { onlineIds: ['u1'] } },
    });
    expect(screen.getByRole('img', { name: 'Offline' })).toBeInTheDocument();
  });
});
