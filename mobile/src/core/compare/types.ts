export type CompareRunStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'partial'
  | 'failed'
  | 'cancelled'
  | 'interrupted'

export type CompareBranchStatus =
  | 'queued'
  | 'streaming'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'interrupted'

export type JudgeRunStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'

export type ComparePresetRecord = {
  id: string
  name: string
  targetModelsJson: string
  judgeConfigJson: string
  sharedContextEnabled: boolean
  advancedParamsJson: string
  createdAt: number
  updatedAt: number
}

export type CompareRunRecord = {
  id: string
  threadId: string
  promptTurnId: string
  status: CompareRunStatus
  presetId: string | null
  compareConfigJson: string
  judgeConfigJson: string
  retrievalContextJson: string
  aggregateUsageJson: string
  aggregateTimingJson: string
  createdAt: number
  updatedAt: number
}

export type CompareBranchRecord = {
  id: string
  compareRunId: string
  branchIndex: number
  providerProfileId: string
  modelId: string
  status: CompareBranchStatus
  contentJson: string
  usageJson: string
  latencyMs: number | null
  errorJson: string
  continuationThreadId: string | null
  attemptCount: number
  createdAt: number
  updatedAt: number
}

export type JudgeRunRecord = {
  id: string
  compareRunId: string
  providerProfileId: string
  modelId: string
  status: JudgeRunStatus
  contentJson: string
  usageJson: string
  latencyMs: number | null
  errorJson: string
  createdAt: number
  updatedAt: number
}
