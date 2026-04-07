import { describe, expect, it } from '@jest/globals'

import { reduceCompareEvent } from '../stateMachine'

describe('reduceCompareEvent', () => {
  it('keeps the run active while some branches are still unsettled', () => {
    const state = reduceCompareEvent(
      {
        runStatus: 'running',
        judgeStatus: 'idle',
        branches: {
          alpha: { status: 'streaming', usage: null, latencyMs: null, error: null },
          beta: { status: 'queued', usage: null, latencyMs: null, error: null }
        }
      },
      {
        type: 'branch_failed',
        branchId: 'alpha',
        error: { category: 'timeout', message: 'Timed out' }
      }
    )

    expect(state.branches.alpha.status).toBe('failed')
    expect(state.runStatus).toBe('running')
  })

  it('marks the run partial when at least one branch succeeds and one fails', () => {
    const state = reduceCompareEvent(
      {
        runStatus: 'running',
        judgeStatus: 'idle',
        branches: {
          alpha: { status: 'failed', usage: null, latencyMs: null, error: null },
          beta: { status: 'streaming', usage: null, latencyMs: null, error: null }
        }
      },
      {
        type: 'branch_completed',
        branchId: 'beta',
        usage: { inputTokens: 12, outputTokens: 7 },
        latencyMs: 280
      }
    )

    expect(state.branches.beta.status).toBe('completed')
    expect(state.runStatus).toBe('partial')
  })
})
