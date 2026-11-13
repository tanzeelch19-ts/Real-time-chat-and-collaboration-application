import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import MessageComposer from '@/components/messaging/MessageComposer';

const baseProps = {
  value: '',
  onChange: vi.fn(),
  onSubmit: vi.fn(),
  disabled: false,
  placeholder: 'Message #general',
  members: [],
};

describe('MessageComposer uploads', () => {
  it('passes a chosen file to onAttach', () => {
    const onAttach = vi.fn();
    const { container } = render(<MessageComposer {...baseProps} onAttach={onAttach} />);
    const input = container.querySelector('input[type="file"]');
    const file = new File(['hello'], 'notes.txt', { type: 'text/plain' });

    fireEvent.change(input, { target: { files: [file] } });

    expect(onAttach).toHaveBeenCalledWith(file);
  });

  it('shows upload progress as a percentage', () => {
    render(<MessageComposer {...baseProps} onAttach={() => {}} uploading uploadProgress={40} />);
    expect(screen.getByRole('status')).toHaveTextContent('Uploading 40%');
  });
});