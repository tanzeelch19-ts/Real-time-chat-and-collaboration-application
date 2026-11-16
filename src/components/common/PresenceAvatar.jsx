import Avatar from '@/components/common/Avatar';
import PresenceDot from '@/components/common/PresenceDot';
import { cn } from '@/utils/cn';

/** Avatar with a presence dot in the corner. */
export default function PresenceAvatar({ userId, name, src, size = 'md', className }) {
  return (
    <span className={cn('relative inline-flex shrink-0', className)}>
      <Avatar name={name} src={src} size={size} />
      <PresenceDot userId={userId} className="absolute bottom-0 right-0" />
    </span>
  );
}
