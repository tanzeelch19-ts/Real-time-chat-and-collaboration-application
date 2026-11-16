import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import RichText from '@/components/messaging/RichText';

describe('RichText', () => {
  it('renders bold, code, and clickable links', () => {
    const { container } = render(
      <RichText text="Hi **team** run `npm run dev` at https://example.com" names={[]} />,
    );
    expect(container.querySelector('strong')).toHaveTextContent('team');
    expect(container.querySelector('code')).toHaveTextContent('npm run dev');
    expect(screen.getByRole('link', { name: 'https://example.com' })).toHaveAttribute(
      'rel',
      'noopener noreferrer',
    );
  });
});
