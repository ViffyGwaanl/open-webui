import { describe, expect, it, jest } from '@jest/globals'

import { runSingleTurn } from '../singleRun'

describe('runSingleTurn', () => {
  it('emits canonical events and persists the assistant turn', async () => {
    const streamText = jest.fn<
      (request: { prompt: string }, sink: (event: any) => void) => Promise<void>
    >(async (_request, sink) => {
      sink({ type: 'response_started' })
      sink({ type: 'text_delta', text: 'Hello' })
      sink({ type: 'response_completed', usage: { inputTokens: 3, outputTokens: 1 } })
    })

    const adapter = {
      streamText
    }
    const threadService = {
      createUserTurn: jest.fn(),
      appendAssistantDelta: jest.fn(),
      completeAssistantTurn: jest.fn()
    }

    await runSingleTurn({
      adapter: adapter as any,
      threadService: threadService as any,
      threadId: 'thread-1',
      prompt: 'Hi'
    })

    expect(threadService.createUserTurn).toHaveBeenCalledWith('thread-1', 'Hi')
    expect(threadService.appendAssistantDelta).toHaveBeenCalledWith('thread-1', 'Hello')
    expect(threadService.completeAssistantTurn).toHaveBeenCalledWith(
      'thread-1',
      expect.objectContaining({ outputTokens: 1 })
    )
  })
})
