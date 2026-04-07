import { describe, expect, it, jest } from '@jest/globals'

import type { CanonicalStreamEvent } from '../../core/chat/types'
import { CompareExecutionService } from '../CompareExecutionService'

describe('CompareExecutionService', () => {
  it('resolves compare targets and delegates branch/judge execution to CompareService', async () => {
    const compareService = {
      startRun: jest.fn(async () => ({
        compareRunId: 'compare-1',
        promptTurnId: 'turn-user-1',
        status: 'completed'
      }))
    }
    const selectionService = {
      resolveCompareTargets: jest.fn(async () => ({
        branches: [
          {
            providerProfileId: 'openai-main',
            providerLabel: 'OpenAI',
            modelId: 'gpt-4.1',
            modelLabel: 'GPT-4.1'
          },
          {
            providerProfileId: 'claude-main',
            providerLabel: 'Claude',
            modelId: 'claude-3-7-sonnet-latest',
            modelLabel: 'Claude 3.7 Sonnet'
          }
        ],
        judge: {
          providerProfileId: 'openai-main',
          providerLabel: 'OpenAI',
          modelId: 'gpt-4.1',
          modelLabel: 'GPT-4.1'
        }
      }))
    }
    const providerRuntimeService = {
      streamText: jest.fn(
        async (
          _request,
          sink: (event: CanonicalStreamEvent) => void | Promise<void>
        ) => {
          await sink({ type: 'response_started' })
          await sink({ type: 'text_delta', text: 'Answer' })
          await sink({
            type: 'response_completed',
            usage: { inputTokens: 7, outputTokens: 2 }
          })
        }
      ),
      generateText: jest.fn(async () => 'Judge summary')
    }
    const service = new CompareExecutionService({
      compareService: compareService as never,
      selectionService: selectionService as never,
      providerRuntimeService: providerRuntimeService as never
    })

    const result = await service.run({
      threadId: 'thread-1',
      prompt: 'Compare this'
    })

    expect(selectionService.resolveCompareTargets).toHaveBeenCalled()
    expect(compareService.startRun).toHaveBeenCalledWith(
      expect.objectContaining({
        threadId: 'thread-1',
        prompt: 'Compare this',
        branches: expect.arrayContaining([
          expect.objectContaining({
            providerProfileId: 'openai-main',
            modelId: 'gpt-4.1'
          }),
          expect.objectContaining({
            providerProfileId: 'claude-main',
            modelId: 'claude-3-7-sonnet-latest'
          })
        ]),
        judge: expect.objectContaining({
          providerProfileId: 'openai-main',
          modelId: 'gpt-4.1'
        })
      })
    )
    expect(result.status).toBe('completed')
  })
})
