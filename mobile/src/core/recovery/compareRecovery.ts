type RecoverableBranch = {
  id: string
  status: string
}

type RecoverableJudge = {
  id: string
  status: string
} | null

type RecoverableRun = {
  id: string
  status: string
}

export function recoverCompareRun(input: {
  run: RecoverableRun
  branches: RecoverableBranch[]
  judge: RecoverableJudge
}) {
  const branchPatches = input.branches
    .filter((branch) => branch.status === 'queued' || branch.status === 'streaming' || branch.status === 'running')
    .map((branch) => ({
      branchId: branch.id,
      status: 'interrupted' as const
    }))

  const completedBranches = input.branches.filter((branch) => branch.status === 'completed').length
  const runStatus = completedBranches > 0 ? 'partial' : 'failed'

  return {
    runId: input.run.id,
    runStatus,
    branchPatches,
    judgePatch:
      input.judge && (input.judge.status === 'queued' || input.judge.status === 'running')
        ? {
            judgeRunId: input.judge.id,
            status: 'failed' as const
          }
        : null
  }
}
