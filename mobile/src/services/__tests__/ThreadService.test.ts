import { describe, expect, it } from '@jest/globals'

import { ThreadService } from '../ThreadService'

type StoredTurn = {
  id: string
  threadId: string
  role: 'user' | 'assistant'
  status: string
  contentJson: string
  usageJson: string
  providerProfileId: string | null
  modelId: string | null
  createdAt: number
  updatedAt: number
}

function createThreadRepositoryFixture(initialTurns: StoredTurn[] = []) {
  const turns = [...initialTurns]

  return {
    turns,
    repository: {
      async insertTurn(turn: StoredTurn) {
        turns.push(turn)
      },
      async findLatestAssistantTurn(threadId: string) {
        return (
          [...turns]
            .reverse()
            .find((turn) => turn.threadId === threadId && turn.role === 'assistant') ?? null
        )
      },
      async updateTurn(
        turnId: string,
        patch: Partial<Pick<StoredTurn, 'contentJson' | 'status' | 'usageJson' | 'updatedAt'>>
      ) {
        const turn = turns.find((entry) => entry.id === turnId)
        if (!turn) {
          throw new Error(`Turn ${turnId} not found`)
        }

        Object.assign(turn, patch)
      },
      async listTurns(threadId: string) {
        return turns
          .filter((turn) => turn.threadId === threadId)
          .sort((left, right) => left.createdAt - right.createdAt)
      }
    }
  }
}

describe('ThreadService', () => {
  it('persists completed user turns as text content blocks', async () => {
    const { repository, turns } = createThreadRepositoryFixture()
    const service = new ThreadService(repository as never, {
      listTimelineCards: async () => []
    } as never)

    await service.createUserTurn('thread-1', 'Explain compare mode')

    expect(turns).toHaveLength(1)
    expect(turns[0]).toMatchObject({
      threadId: 'thread-1',
      role: 'user',
      status: 'completed'
    })
    expect(JSON.parse(turns[0].contentJson)).toEqual([{ type: 'text', text: 'Explain compare mode' }])
  })

  it('accumulates assistant deltas into one streaming turn and completes it with usage', async () => {
    const { repository, turns } = createThreadRepositoryFixture()
    const service = new ThreadService(repository as never, {
      listTimelineCards: async () => []
    } as never)

    await service.appendAssistantDelta('thread-1', 'Hello')
    await service.appendAssistantDelta('thread-1', ' world')
    await service.completeAssistantTurn('thread-1', { inputTokens: 3, outputTokens: 2 })

    expect(turns).toHaveLength(1)
    expect(JSON.parse(turns[0].contentJson)).toEqual([{ type: 'text', text: 'Hello world' }])
    expect(turns[0].status).toBe('completed')
    expect(JSON.parse(turns[0].usageJson)).toEqual({ inputTokens: 3, outputTokens: 2 })
  })

  it('merges compare cards into the thread timeline after their source prompt turn', async () => {
    const { repository } = createThreadRepositoryFixture([
      {
        id: 'turn-user-1',
        threadId: 'thread-1',
        role: 'user',
        status: 'completed',
        contentJson: JSON.stringify([{ type: 'text', text: 'Compare these answers' }]),
        usageJson: '{}',
        providerProfileId: null,
        modelId: null,
        createdAt: 1,
        updatedAt: 1
      },
      {
        id: 'turn-assistant-1',
        threadId: 'thread-1',
        role: 'assistant',
        status: 'completed',
        contentJson: JSON.stringify([{ type: 'text', text: 'Standalone answer' }]),
        usageJson: '{}',
        providerProfileId: 'openai-main',
        modelId: 'gpt-4.1-mini',
        createdAt: 3,
        updatedAt: 3
      }
    ])
    const service = new ThreadService(repository as never, {
      async listTimelineCards() {
        return [
          {
            id: 'compare-1',
            promptTurnId: 'turn-user-1',
            status: 'completed',
            judgeSummary: 'Candidate A was clearer.',
            branches: [
              {
                id: 'branch-1',
                providerProfileId: 'openai-main',
                modelId: 'gpt-4.1',
                status: 'completed',
                text: 'Answer A',
                usageJson: '{}',
                latencyMs: 320,
                errorJson: '{}'
              }
            ]
          }
        ]
      }
    } as never)

    const timeline = await service.listTimeline('thread-1')

    expect(timeline.map((item) => item.kind)).toEqual(['turn', 'compare_run', 'turn'])
    expect(timeline[1]).toMatchObject({
      kind: 'compare_run',
      promptTurnId: 'turn-user-1',
      judgeSummary: 'Candidate A was clearer.'
    })
  })
})
