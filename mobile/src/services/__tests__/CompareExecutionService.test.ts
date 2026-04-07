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
        presetId: 'preset-triad',
        sharedContextEnabled: false,
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
      generateText: jest.fn(async () => 'Judge summary'),
      embedTexts: jest.fn(async () => [])
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
        presetId: 'preset-triad',
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

  it('injects shared retrieval context into compare branch prompts when enabled', async () => {
    const compareService = {
      startRun: jest.fn(async (input: any) => {
        await input.branches[0].streamText({ prompt: 'Compare this' }, async () => {})
        return {
          compareRunId: 'compare-2',
          promptTurnId: 'turn-user-2',
          status: 'completed'
        }
      })
    }
    const selectionService = {
      resolveCompareTargets: jest.fn(async () => ({
        presetId: 'preset-rag',
        sharedContextEnabled: true,
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
      })),
      resolveEmbeddingTarget: jest.fn(async () => ({
        providerProfileId: 'openai-main',
        providerLabel: 'OpenAI',
        modelId: 'text-embedding-3-small',
        modelLabel: 'text-embedding-3-small'
      }))
    }
    const providerRuntimeService = {
      streamText: jest.fn(async () => {}),
      generateText: jest.fn(async () => 'Judge summary'),
      embedTexts: jest.fn(async () => [])
    }
    const retrievalService = {
      retrieve: jest.fn(async () => ({
        snippets: [
          {
            id: 'chunk-1',
            documentId: 'doc-1',
            sourceLabel: 'guide.md',
            snippetText: 'Shared architecture note',
            sectionTitle: 'Intro',
            pageNumber: null
          }
        ]
      }))
    }
    const service = new CompareExecutionService({
      compareService: compareService as never,
      selectionService: selectionService as never,
      providerRuntimeService: providerRuntimeService as never,
      createRetrievalService: () => retrievalService as never
    })

    await service.run({
      threadId: 'thread-1',
      prompt: 'Compare this'
    })

    expect(retrievalService.retrieve).toHaveBeenCalledWith('Compare this')
    expect(compareService.startRun).toHaveBeenCalledWith(
      expect.objectContaining({
        presetId: 'preset-rag',
        retrievalContext: {
          snippets: [
            expect.objectContaining({
              sourceLabel: 'guide.md'
            })
          ]
        }
      })
    )
    expect(providerRuntimeService.streamText).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining('Shared architecture note')
      }),
      expect.any(Function)
    )
  })

  it('does not pass a judge when the active preset disables judge', async () => {
    const compareService = {
      startRun: jest.fn(async () => ({
        compareRunId: 'compare-no-judge',
        promptTurnId: 'turn-user-3',
        status: 'completed'
      }))
    }
    const selectionService = {
      resolveCompareTargets: jest.fn(async () => ({
        presetId: 'preset-no-judge',
        sharedContextEnabled: false,
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
        judge: null
      }))
    }
    const providerRuntimeService = {
      streamText: jest.fn(async () => {}),
      generateText: jest.fn(async () => 'Judge summary'),
      embedTexts: jest.fn(async () => [])
    }
    const service = new CompareExecutionService({
      compareService: compareService as never,
      selectionService: selectionService as never,
      providerRuntimeService: providerRuntimeService as never
    })

    await service.run({
      threadId: 'thread-1',
      prompt: 'Compare this'
    })

    expect(compareService.startRun).toHaveBeenCalledWith(
      expect.objectContaining({
        presetId: 'preset-no-judge',
        judge: undefined
      })
    )
  })

  it('gracefully skips shared retrieval when no embedding target is configured', async () => {
    const compareService = {
      startRun: jest.fn(async (input: any) => {
        await input.branches[0].streamText({ prompt: 'Compare without embeddings' }, async () => {})
        return {
          compareRunId: 'compare-no-embedding',
          promptTurnId: 'turn-user-4',
          status: 'completed'
        }
      })
    }
    const selectionService = {
      resolveCompareTargets: jest.fn(async () => ({
        presetId: 'preset-shared-context',
        sharedContextEnabled: true,
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
        judge: null
      })),
      resolveEmbeddingTarget: jest.fn(async () => {
        throw new Error('No enabled model target is configured')
      })
    }
    const providerRuntimeService = {
      streamText: jest.fn(async () => {}),
      generateText: jest.fn(async () => 'Judge summary'),
      embedTexts: jest.fn(async () => [])
    }
    const retrievalService = {
      retrieve: jest.fn(async () => ({
        snippets: []
      }))
    }
    const service = new CompareExecutionService({
      compareService: compareService as never,
      selectionService: selectionService as never,
      providerRuntimeService: providerRuntimeService as never,
      createRetrievalService: () => retrievalService as never
    })

    await expect(
      service.run({
        threadId: 'thread-1',
        prompt: 'Compare without embeddings'
      })
    ).resolves.toEqual(
      expect.objectContaining({
        status: 'completed'
      })
    )

    expect(retrievalService.retrieve).not.toHaveBeenCalled()
    expect(providerRuntimeService.streamText).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: 'Compare without embeddings'
      }),
      expect.any(Function)
    )
  })
})
