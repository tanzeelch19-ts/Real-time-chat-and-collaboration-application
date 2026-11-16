import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ConfirmationDialog from '@/components/common/ConfirmationDialog';
import EmojiPicker from '@/components/common/EmojiPicker';
import WorkspaceSwitcher from '@/components/navigation/WorkspaceSwitcher';
import { useWorkspaces } from '@/features/workspaces/useWorkspaces';
import { renderWithProviders } from '@/test/renderWithProviders';

vi.mock('@/features/workspaces/useWorkspaces', () => ({ useWorkspaces: vi.fn() }));

describe('keyboard use', () => {
  it('opens the workspace switcher with Enter and closes it with Escape', async () => {
    const user = userEvent.setup();
    useWorkspaces.mockReturnValue({ data: [{ id: 'w1', name: 'Demo Workspace', myRole: 'owner' }] });
    renderWithProviders(<WorkspaceSwitcher />);

    const trigger = screen.getByRole('button', { name: /Workspace/ });
    trigger.focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('listbox', { name: 'Your workspaces' })).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('moves focus through emoji choices with Tab and picks one with Enter', async () => {
    const user = userEvent.setup();
    const onPick = vi.fn();
    renderWithProviders(<EmojiPicker onPick={onPick} />);

    await user.tab();
    expect(screen.getByRole('button', { name: 'Thumbs up' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Thumbs down' })).toHaveFocus();
    await user.tab({ shift: true });
    await user.keyboard('{Enter}');

    expect(onPick).toHaveBeenCalledWith('\u{1F44D}');
  });

  it('moves focus into a confirmation dialog when it opens', () => {
    renderWithProviders(
      <ConfirmationDialog
        open
        title="Delete this message?"
        confirmLabel="Delete"
        danger
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
  });
});
