import { describe, expect, it } from '@jest/globals'

import { aggregateRunMetrics } from '../aggregateRunMetrics'

describe('aggregateRunMetrics', () => {
  it('sums usage across completed branches and ignores failed branches without usage', () => {
    const metrics = aggregateRunMetrics([
      {
        status: 'completed',
        usage: { inputTokens: 10, outputTokens: 4 },
        latencyMs: 120
      },
      {
        status: 'failed',
        usage: null,
        latencyMs: 300
      },
      {
        status: 'completed',
        usage: { inputTokens: 8, outputTokens: 6 },
        latencyMs: 240
      }
    ])

    expect(metrics.usage).toEqual({ inputTokens: 18, outputTokens: 10 })
    expect(metrics.timing.completedBranchCount).toBe(2)
    expect(metrics.timing.maxLatencyMs).toBe(300)
  })
})
