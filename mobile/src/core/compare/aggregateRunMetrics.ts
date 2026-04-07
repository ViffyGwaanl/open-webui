import type { CanonicalUsage } from '../chat/types'

type BranchMetricsInput = {
  status: string
  usage: CanonicalUsage | null
  latencyMs: number | null
}

export function aggregateRunMetrics(branches: BranchMetricsInput[]) {
  const usage = branches.reduce(
    (current, branch) => ({
      inputTokens: current.inputTokens + (branch.usage?.inputTokens ?? 0),
      outputTokens: current.outputTokens + (branch.usage?.outputTokens ?? 0)
    }),
    {
      inputTokens: 0,
      outputTokens: 0
    }
  )
  const latencies = branches
    .map((branch) => branch.latencyMs)
    .filter((latency): latency is number => latency !== null)

  return {
    usage,
    timing: {
      completedBranchCount: branches.filter((branch) => branch.status === 'completed').length,
      maxLatencyMs: latencies.length > 0 ? Math.max(...latencies) : null
    }
  }
}
