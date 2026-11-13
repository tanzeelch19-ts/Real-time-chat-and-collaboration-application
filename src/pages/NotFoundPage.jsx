import { Link } from 'react-router-dom';
import EmptyState from '@/components/common/EmptyState';

export default function NotFoundPage() {
  return (
    <EmptyState
      title="Page not found"
      description="The page you are looking for does not exist or was moved."
      action={
        <Link
          to="/"
          className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-300"
        >
          Go to home
        </Link>
      }
    />
  );
}