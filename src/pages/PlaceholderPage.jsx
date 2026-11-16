import { Construction } from 'lucide-react';
import EmptyState from '@/components/common/EmptyState';

export default function PlaceholderPage({ title }) {
  return (
    <EmptyState
      icon={Construction}
      title={title}
      description="The screen shell is ready. Its features are built in a later phase."
    />
  );
}
