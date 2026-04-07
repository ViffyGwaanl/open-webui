import { describe, expect, it, jest } from '@jest/globals'

import type { CanonicalStreamEvent } from '../../core/chat/types'
import { SingleTurnExecutionService } from '../SingleTurnExecutionService'

describe('SingleTurnExecutionService', () => {
  it('resolves the default chat target and streams the answer into the thread timeline', async () => {
    const threadService = {
      createUserTurn: jest.fn(async () => 'turn-user-1'),
      appendAssistantDelta: jest.fn(async () => {}),
      completeAssistantTurn: jest.fn(async () => {})
    }
    const providerRuntimeService = {
      streamText: jest.fn(
        async (
          _request,
          sink: (event: CanonicalStreamEvent) => void | Promise<void>
        ) => {
          await sink({ type: 'response_started' })
          await sink({ type: 'text_delta', text: 'Hello from runtime' })
          await sink({
            type: 'response_completed',
            usage: { inputTokens: 6, outputTokens: 3 }
          })
        }
      )
    }
    const selectionService = {
      resolveSingleChatTarget: jest.fn(async () => ({
        providerProfileId: 'openai-main',
        providerLabel: 'OpenAI',
        modelId: 'gpt-4.1-mini',
        modelLabel: 'GPT-4.1 mini'
      }))
    }
    const service = new SingleTurnExecutionService({
      threadService: threadService as never,
      providerRuntimeService: providerRuntimeService as never,
      selectionService: selectionService as never
    })

    await service.run({
      threadId: 'thread-1',
      prompt: 'Hello'
    })

    expect(selectionService.resolveSingleChatTarget).toHaveBeenCalled()
    expect(providerRuntimeService.streamText).toHaveBeenCalledWith(
      expect.objectContaining({
        providerProfileId: 'openai-main',
        modelId: 'gpt-4.1-mini',
        prompt: 'Hello'
      }),
      expect.any(Function)
    )
    expect(threadService.createUserTurn).toHaveBeenCalledWith('thread-1', 'Hello')
    expect(threadService.appendAssistantDelta).toHaveBeenCalledWith('thread-1', 'Hello from runtime')
    expect(threadService.completeAssistantTurn).toHaveBeenCalledWith(
      'thread-1',
      expect.objectContaining({ outputTokens: 3 })
    )
  })
})
