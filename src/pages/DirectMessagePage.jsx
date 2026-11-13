import { useParams } from 'react-router-dom';
import { useConversations } from '@/features/conversations/useConversations';
import RoomView from '@/features/messages/components/RoomView';

export default function DirectMessagePage() {
  const { workspaceId, conversationId } = useParams();
  const { data: conversations } = useConversations(workspaceId);
  const conversation = conversations?.find((c) => c.id === conversationId);

  return (
    <RoomView
      key={conversationId}
      roomId={`conversation:${conversationId}`}
      title={conversation?.name ?? 'Direct message'}
      subtitle={
        conversation?.kind === 'group' ? `${conversation.members.length} people` : undefined
      }
    />
  );
}