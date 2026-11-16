import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ChannelList from '@/components/navigation/ChannelList';
import { useChannels } from '@/features/channels/useChannels';
import { renderWithProviders } from '@/test/renderWithProviders';

vi.mock('@/features/channels/useChannels', () => ({ useChannels: vi.fn() }));

const CHANNELS = [
  { id: 'c1', name: 'general', visibility: 'public' },
  { id: 'c2', name: 'leadership', visibility: 'private' },
];

describe('ChannelList', () => {
  beforeEach(() => {
    useChannels.mockReturnValue({ data: CHANNELS, isPending: false, isError: false });
  });

  it('lists the channels the server returned', () => {
    renderWithProviders(<ChannelList workspaceId="w1" role="member" onCreate={() => {}} />);

    expect(screen.getByText('general')).toBeInTheDocument();
    expect(screen.getByText('leadership')).toBeInTheDocument();
  });

  it('shows the create button to members but not to guests', () => {
    const { unmount } = renderWithProviders(
      <ChannelList workspaceId="w1" role="member" onCreate={() => {}} />,
    );
    expect(screen.getByRole('button', { name: 'Create channel' })).toBeInTheDocument();
    unmount();

    renderWithProviders(<ChannelList workspaceId="w1" role="guest" onCreate={() => {}} />);
    expect(screen.queryByRole('button', { name: 'Create channel' })).not.toBeInTheDocument();
  });
});
