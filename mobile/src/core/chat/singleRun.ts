import type { CanonicalUsage } from './types'
import type { StreamSink } from './streamEvents'

type SingleRunArgs = {
  adapter: { streamText: (request: { prompt: string }, sink: StreamSink) => Promise<void> }
  threadService: {
    createUserTurn: (threadId: string, prompt: string) => Promise<void>
    appendAssistantDelta: (threadId: string, text: string) => Promise<void>
    completeAssistantTurn: (threadId: string, usage: CanonicalUsage) => Promise<void>
  }
  threadId: string
  prompt: string
}

export async function runSingleTurn({
  adapter,
  threadService,
  threadId,
  prompt
}: SingleRunArgs) {
  await threadService.createUserTurn(threadId, prompt)

  await adapter.streamText({ prompt }, async (event) => {
    if (event.type === 'text_delta') {
      await threadService.appendAssistantDelta(threadId, event.text)
    }

    if (event.type === 'response_completed') {
      await threadService.completeAssistantTurn(threadId, event.usage)
    }

    if (event.type === 'response_failed') {
      throw new Error(event.message)
    }
  })
}
