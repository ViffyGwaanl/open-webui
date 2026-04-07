import { describe, expect, it, jest } from '@jest/globals'

import type { CanonicalStreamEvent } from '../../core/chat/types'
import { RunSingleTurnWithRagService } from '../RunSingleTurnWithRagService'

describe('RunSingleTurnWithRagService', () => {
  it('injects retrieved snippets into the prompt and persists evidence snapshot', async () => {
    const retrievalService = {
      retrieve: jest.fn(async () => ({
        snippets: [
          {
            id: 'chunk-1',
            documentId: 'doc-1',
            sourceLabel: 'guide.md',
            snippetText: 'Important architecture note',
            sectionTitle: 'Intro',
            pageNumber: null
          }
        ]
      }))
    }
    const turnEvidenceService = {
      saveSnapshot: jest.fn(async () => {})
    }
    const threadService = {
      createUserTurn: jest.fn(async () => 'turn-user-1'),
      appendAssistantDelta: jest.fn(async () => {}),
      completeAssistantTurn: jest.fn(async () => {})
    }
    const streamText: jest.MockedFunction<
      (
        request: { prompt: string },
        sink: (event: CanonicalStreamEvent) => void | Promise<void>
      ) => Promise<void>
    > = jest.fn(
      async (
        _request: { prompt: string },
        sink: (event: CanonicalStreamEvent) => void | Promise<void>
      ) => {
        await sink({ type: 'response_started' })
        await sink({ type: 'text_delta', text: 'Answer with RAG' })
        await sink({
          type: 'response_completed',
          usage: { inputTokens: 10, outputTokens: 4 }
        })
      }
    )
    const service = new RunSingleTurnWithRagService({
      retrievalService: retrievalService as never,
      turnEvidenceService: turnEvidenceService as never,
      threadService: threadService as never
    })

    await service.run({
      threadId: 'thread-1',
      prompt: 'Summarize the guide',
      streamText
    })

    expect(streamText).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining('Important architecture note')
      }),
      expect.any(Function)
    )
    expect(turnEvidenceService.saveSnapshot).toHaveBeenCalledWith(
      'turn-user-1',
      expect.objectContaining({
        snippets: expect.arrayContaining([
          expect.objectContaining({ id: 'chunk-1' })
        ])
      })
    )
  })
})
