import { useLocalSearchParams } from 'expo-router'

import { CompareExecutionService } from '../../src/services/CompareExecutionService'
import { SingleTurnExecutionService } from '../../src/services/SingleTurnExecutionService'
import { ThreadService } from '../../src/services/ThreadService'
import { ChatScreen } from '../../src/features/chat/ChatScreen'

const singleTurnExecutionService = new SingleTurnExecutionService()
const compareExecutionService = new CompareExecutionService()
const threadService = new ThreadService()

export default function ThreadChatRoute() {
  const params = useLocalSearchParams<{ threadId?: string | string[] }>()
  const threadId = Array.isArray(params.threadId) ? params.threadId[0] : params.threadId

  return (
    <ChatScreen
      threadId={threadId ?? 'thread-1'}
      runSingleTurn={async ({ threadId: activeThreadId, prompt }) => {
        await singleTurnExecutionService.run({
          threadId: activeThreadId,
          prompt
        })
      }}
      runCompareTurn={async ({ threadId: activeThreadId, prompt }) => {
        await compareExecutionService.run({
          threadId: activeThreadId,
          prompt
        })
      }}
      loadTimeline={(activeThreadId) => threadService.listTimeline(activeThreadId)}
    />
  )
}
