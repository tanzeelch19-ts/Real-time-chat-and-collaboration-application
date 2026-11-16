import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import MentionText from '@/components/messaging/MentionText';

describe('MentionText', () => {
  it('highlights a known member name', () => {
    render(<MentionText text="Hi @Hira Member, check this" names={['Hira Member']} />);
    expect(screen.getByText('@Hira Member').tagName).toBe('MARK');
  });

  it('leaves the text alone when there are no names', () => {
    const { container } = render(<MentionText text="Hi @Hira" names={[]} />);
    expect(container).toHaveTextContent('Hi @Hira');
    expect(container.querySelector('mark')).toBeNull();
  });
});
