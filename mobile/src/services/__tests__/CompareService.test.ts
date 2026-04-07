import { describe, expect, it, jest } from '@jest/globals'

import { CompareService } from '../CompareService'

function createIdSequence(...ids: string[]) {
  let index = 0
  return () => {
    const id = ids[index]
    index += 1
    if (!id) {
      throw new Error('Ran out of ids')
    }

    return id
  }
}

describe('CompareService', () => {
  it('persists a partial compare run when one branch succeeds and one branch fails', async () => {
    const compareRepository = {
      insertRun: jest.fn(),
      insertBranches: jest.fn(),
      updateRun: jest.fn(),
      updateBranch: jest.fn(),
      insertJudgeRun: jest.fn(),
      updateJudgeRun: jest.fn()
    }
    const threadService = {
      createUserTurn: jest.fn(async () => 'turn-user-1')
    }
    const service = new CompareService({
      compareRepository: compareRepository as never,
      threadService: threadService as never,
      createId: createIdSequence('compare-run-1', 'branch-1', 'branch-2', 'judge-run-1'),
      now: (() => {
        let value = 100
        return () => {
          value += 50
          return value
        }
      })()
    })

    const result = await service.startRun({
      threadId: 'thread-1',
      prompt: 'Compare these answers',
      branches: [
        {
          providerProfileId: 'openai-main',
          providerLabel: 'OpenAI',
          modelId: 'gpt-4.1',
          modelLabel: 'GPT-4.1',
          streamText: async (_request, sink) => {
            await sink({ type: 'response_started' })
            await sink({ type: 'text_delta', text: 'Answer A' })
            await sink({ type: 'response_completed', usage: { inputTokens: 10, outputTokens: 4 } })
          }
        },
        {
          providerProfileId: 'claude-main',
          providerLabel: 'Claude',
          modelId: 'claude-3-7-sonnet',
          modelLabel: 'Claude 3.7 Sonnet',
          streamText: async (_request, sink) => {
            await sink({ type: 'response_started' })
            await sink({ type: 'response_failed', message: 'Request timeout after 30s' })
          }
        }
      ],
      judge: {
        providerProfileId: 'judge-main',
        providerLabel: 'OpenAI',
        modelId: 'gpt-4.1',
        modelLabel: 'GPT-4.1',
        streamText: jest.fn(async () => 'Candidate 1 is more complete.')
      }
    })

    expect(threadService.createUserTurn).toHaveBeenCalledWith('thread-1', 'Compare these answers')
    expect(compareRepository.insertRun).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'compare-run-1',
        promptTurnId: 'turn-user-1',
        status: 'running'
      })
    )
    expect(compareRepository.insertBranches).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: 'branch-1', status: 'queued', modelId: 'gpt-4.1' }),
        expect.objectContaining({ id: 'branch-2', status: 'queued', modelId: 'claude-3-7-sonnet' })
      ])
    )
    expect(compareRepository.updateBranch).toHaveBeenCalledWith(
      'branch-1',
      expect.objectContaining({
        status: 'completed',
        contentJson: JSON.stringify([{ type: 'text', text: 'Answer A' }])
      })
    )
    expect(compareRepository.updateBranch).toHaveBeenCalledWith(
      'branch-2',
      expect.objectContaining({
        status: 'failed'
      })
    )
    expect(compareRepository.insertJudgeRun).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'judge-run-1',
        compareRunId: 'compare-run-1',
        status: 'running'
      })
    )
    expect(compareRepository.updateJudgeRun).toHaveBeenCalledWith(
      'judge-run-1',
      expect.objectContaining({
        status: 'completed',
        contentJson: JSON.stringify([{ type: 'text', text: 'Candidate 1 is more complete.' }])
      })
    )
    expect(compareRepository.updateRun).toHaveBeenLastCalledWith(
      'compare-run-1',
      expect.objectContaining({
        status: 'partial'
      })
    )
    expect(result).toEqual(
      expect.objectContaining({
        compareRunId: 'compare-run-1',
        status: 'partial'
      })
    )
  })

  it('skips judge execution when every branch fails', async () => {
    const compareRepository = {
      insertRun: jest.fn(),
      insertBranches: jest.fn(),
      updateRun: jest.fn(),
      updateBranch: jest.fn(),
      insertJudgeRun: jest.fn(),
      updateJudgeRun: jest.fn()
    }
    const service = new CompareService({
      compareRepository: compareRepository as never,
      threadService: {
        createUserTurn: async () => 'turn-user-1'
      } as never,
      createId: createIdSequence('compare-run-2', 'branch-3'),
      now: () => 200
    })

    const result = await service.startRun({
      threadId: 'thread-1',
      prompt: 'Compare these answers',
      branches: [
        {
          providerProfileId: 'gemini-main',
          providerLabel: 'Gemini',
          modelId: 'gemini-2.5-pro',
          modelLabel: 'Gemini 2.5 Pro',
          streamText: async (_request, sink) => {
            await sink({ type: 'response_failed', message: 'Invalid API key' })
          }
        }
      ],
      judge: {
        providerProfileId: 'judge-main',
        providerLabel: 'OpenAI',
        modelId: 'gpt-4.1',
        modelLabel: 'GPT-4.1',
        streamText: jest.fn(async () => 'unused')
      }
    })

    expect(compareRepository.insertJudgeRun).not.toHaveBeenCalled()
    expect(compareRepository.updateJudgeRun).not.toHaveBeenCalled()
    expect(result.status).toBe('failed')
  })
})
