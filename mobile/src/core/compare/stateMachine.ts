import type { CanonicalUsage } from '../chat/types'

import type { CompareRunStatus, JudgeRunStatus } from './types'
import type { NormalizedCompareError } from './compareErrors'

export type CompareBranchRuntimeState = {
  status: 'queued' | 'streaming' | 'completed' | 'failed' | 'cancelled' | 'interrupted'
  usage: CanonicalUsage | null
  latencyMs: number | null
  error: NormalizedCompareError | null
}

export type CompareRuntimeState = {
  runStatus: CompareRunStatus
  judgeStatus: JudgeRunStatus | 'idle'
  branches: Record<string, CompareBranchRuntimeState>
}

export type CompareRuntimeEvent =
  | { type: 'branch_started'; branchId: string }
  | {
      type: 'branch_completed'
      branchId: string
      usage: CanonicalUsage
      latencyMs: number | null
    }
  | {
      type: 'branch_failed'
      branchId: string
      error: NormalizedCompareError
    }
  | { type: 'judge_started' }
  | { type: 'judge_completed' }
  | { type: 'judge_failed' }

function deriveRunStatus(
  branches: Record<string, CompareBranchRuntimeState>,
  previousStatus: CompareRunStatus
): CompareRunStatus {
  const statuses = Object.values(branches).map((branch) => branch.status)
  const hasActiveBranch = statuses.some((status) => status === 'queued' || status === 'streaming')

  if (hasActiveBranch) {
    return 'running'
  }

  const completedCount = statuses.filter((status) => status === 'completed').length
  const failedCount = statuses.filter((status) => status === 'failed').length

  if (completedCount > 0 && failedCount > 0) {
    return 'partial'
  }

  if (completedCount > 0) {
    return 'completed'
  }

  if (failedCount === statuses.length) {
    return 'failed'
  }

  return previousStatus
}

export function reduceCompareEvent(
  state: CompareRuntimeState,
  event: CompareRuntimeEvent
): CompareRuntimeState {
  if (event.type === 'judge_started') {
    return { ...state, judgeStatus: 'running' }
  }

  if (event.type === 'judge_completed') {
    return { ...state, judgeStatus: 'completed' }
  }

  if (event.type === 'judge_failed') {
    return { ...state, judgeStatus: 'failed' }
  }

  const currentBranch = state.branches[event.branchId]

  if (!currentBranch) {
    return state
  }

  let nextBranch: CompareBranchRuntimeState = currentBranch

  if (event.type === 'branch_started') {
    nextBranch = {
      ...currentBranch,
      status: 'streaming',
      error: null
    }
  }

  if (event.type === 'branch_completed') {
    nextBranch = {
      ...currentBranch,
      status: 'completed',
      usage: event.usage,
      latencyMs: event.latencyMs,
      error: null
    }
  }

  if (event.type === 'branch_failed') {
    nextBranch = {
      ...currentBranch,
      status: 'failed',
      error: event.error
    }
  }

  const branches = {
    ...state.branches,
    [event.branchId]: nextBranch
  }

  return {
    ...state,
    branches,
    runStatus: deriveRunStatus(branches, state.runStatus)
  }
}
