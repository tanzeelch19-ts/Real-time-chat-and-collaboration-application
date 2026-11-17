import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import WorkspaceHomePage from '@/pages/WorkspaceHomePage';
import { useChannels } from '@/features/channels/useChannels';
import { useWorkspace } from '@/features/workspaces/useWorkspaces';
import { renderWithProviders } from '@/test/renderWithProviders';

vi.mock('@/features/channels/useChannels', () => ({ useChannels: vi.fn() }));
vi.mock('@/features/workspaces/useWorkspaces', () => ({ useWorkspace: vi.fn() }));

describe('WorkspaceHomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useWorkspace.mockReturnValue({ data: { id: 'w1', name: 'Demo Workspace', description: 'Team space' } });
  });

  it('shows a helpful message, not a placeholder, when there are no channels', () => {
    useChannels.mockReturnValue({ data: [], isPending: false, isError: false });
    renderWithProviders(<WorkspaceHomePage />, { route: '/w/w1' });
    expect(screen.getByRole('heading', { name: 'Welcome to Demo Workspace' })).toBeInTheDocument();
    expect(screen.queryByText(/later phase/i)).not.toBeInTheDocument();
  });

  it('shows a loading state while channels load', () => {
    useChannels.mockReturnValue({ data: undefined, isPending: true, isError: false });
    renderWithProviders(<WorkspaceHomePage />, { route: '/w/w1' });
    expect(screen.getByRole('status')).toHaveTextContent('Loading workspace');
  });
});
