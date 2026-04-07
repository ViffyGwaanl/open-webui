import { describe, expect, it, jest } from '@jest/globals'

import { BranchContinuationService } from '../BranchContinuationService'

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

describe('BranchContinuationService', () => {
  it('creates a child thread from parent history plus the selected branch answer', async () => {
    const repositories = {
      loadContinuationSource: jest.fn(async () => ({
        promptTurn: {
          id: 'turn-user-compare',
          contentJson: JSON.stringify([{ type: 'text', text: 'Compare these answers' }]),
          createdAt: 20
        },
        parentTurns: [
          {
            id: 'turn-user-1',
            threadId: 'thread-parent',
            role: 'user',
            providerProfileId: null,
            modelId: null,
            status: 'completed',
            contentJson: JSON.stringify([{ type: 'text', text: 'First question' }]),
            usageJson: '{}',
            createdAt: 10,
            updatedAt: 10
          },
          {
            id: 'turn-user-compare',
            threadId: 'thread-parent',
            role: 'user',
            providerProfileId: null,
            modelId: null,
            status: 'completed',
            contentJson: JSON.stringify([{ type: 'text', text: 'Compare these answers' }]),
            usageJson: '{}',
            createdAt: 20,
            updatedAt: 20
          }
        ],
        branch: {
          id: 'branch-1',
          providerProfileId: 'openai-main',
          modelId: 'gpt-4.1',
          contentJson: JSON.stringify([{ type: 'text', text: 'Selected branch answer' }])
        }
      })),
      createThread: jest.fn(async () => ({ id: 'thread-child-1' })),
      insertTurns: jest.fn(async () => {}),
      linkContinuationThread: jest.fn(async () => {})
    }
    const service = new BranchContinuationService({
      repositories: repositories as never,
      createId: createIdSequence('thread-child-1', 'turn-copy-1', 'turn-copy-2', 'turn-child-1'),
      now: () => 50
    })

    const result = await service.continueBranch({
      threadId: 'thread-parent',
      compareRunId: 'compare-1',
      branchId: 'branch-1'
    })

    expect(repositories.createThread).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'thread-child-1',
        sourceThreadId: 'thread-parent',
        sourceBranchId: 'branch-1',
        title: 'Compare these answers'
      })
    )
    expect(repositories.insertTurns).toHaveBeenCalledWith(
      'thread-child-1',
      [
        expect.objectContaining({
          id: 'turn-copy-1',
          role: 'user',
          contentJson: JSON.stringify([{ type: 'text', text: 'First question' }])
        }),
        expect.objectContaining({
          id: 'turn-copy-2',
          role: 'user',
          contentJson: JSON.stringify([{ type: 'text', text: 'Compare these answers' }])
        }),
        expect.objectContaining({
          id: 'turn-child-1',
          role: 'assistant',
          providerProfileId: 'openai-main',
          modelId: 'gpt-4.1',
          contentJson: JSON.stringify([{ type: 'text', text: 'Selected branch answer' }])
        })
      ]
    )
    expect(repositories.linkContinuationThread).toHaveBeenCalledWith('branch-1', 'thread-child-1')
    expect(result).toEqual(
      expect.objectContaining({
        id: 'thread-child-1',
        sourceThreadId: 'thread-parent',
        sourceBranchId: 'branch-1'
      })
    )
  })
})
