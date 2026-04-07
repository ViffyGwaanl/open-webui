import { useLocalSearchParams } from 'expo-router'

import { ChatScreen } from '../../src/features/chat/ChatScreen'

export default function ThreadChatRoute() {
  const params = useLocalSearchParams<{ threadId?: string | string[] }>()
  const threadId = Array.isArray(params.threadId) ? params.threadId[0] : params.threadId

  return (
    <ChatScreen
      threadId={threadId ?? 'thread-1'}
      runSingleTurn={async ({ onDelta }) => {
        await onDelta('Hello from model')
      }}
    />
  )
}
