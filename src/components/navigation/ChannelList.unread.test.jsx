import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ChannelList from '@/components/navigation/ChannelList';
import { useChannels } from '@/features/channels/useChannels';
import { renderWithProviders } from '@/test/renderWithProviders';

vi.mock('@/features/channels/useChannels', () => ({ useChannels: vi.fn() }));

describe('ChannelList unread and archived state', () => {
  beforeEach(() => {
    useChannels.mockReturnValue({
      data: [
        { id: 'c1', name: 'general', visibility: 'public', unreadCount: 3, archivedAt: null },
        {
          id: 'c2',
          name: 'random',
          visibility: 'public',
          unreadCount: 0,
          archivedAt: '2026-01-01T00:00:00Z',
        },
      ],
      isPending: false,
      isError: false,
    });
  });

  it('shows the unread count with a screen-reader label', () => {
    renderWithProviders(<ChannelList workspaceId="w1" role="member" onCreate={() => {}} />);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText(/unread messages/)).toBeInTheDocument();
  });

  it('marks archived channels with text, not colour alone', () => {
    renderWithProviders(<ChannelList workspaceId="w1" role="member" onCreate={() => {}} />);
    expect(screen.getByText('archived')).toBeInTheDocument();
  });
});
