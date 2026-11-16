import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ChannelSettingsDialog from '@/features/channels/components/ChannelSettingsDialog';
import { renderWithProviders } from '@/test/renderWithProviders';

const CHANNEL = { id: 'c1', name: 'general', topic: 'Daily updates', description: '', archivedAt: null };

describe('ChannelSettingsDialog', () => {
  it('shows the current topic, with archive unchecked for an active channel', () => {
    renderWithProviders(<ChannelSettingsDialog open onClose={() => {}} workspaceId="w1" channel={CHANNEL} />);
    expect(screen.getByLabelText('Topic')).toHaveValue('Daily updates');
    expect(screen.getByRole('checkbox', { name: /Archive this channel/ })).not.toBeChecked();
  });

  it('renders nothing while closed', () => {
    renderWithProviders(
      <ChannelSettingsDialog open={false} onClose={() => {}} workspaceId="w1" channel={CHANNEL} />,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
