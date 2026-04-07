import { buildJudgePrompt } from './buildJudgePrompt'

type JudgeBranchInput = {
  providerLabel: string
  modelLabel: string
  status: string
  text: string
}

type RunJudgeRunArgs = {
  prompt: string
  branches: JudgeBranchInput[]
  streamText: (prompt: string) => Promise<string>
}

export async function runJudgeRun({
  prompt,
  branches,
  streamText
}: RunJudgeRunArgs): Promise<string | null> {
  const completedBranches = branches.filter(
    (branch) => branch.status === 'completed' && branch.text.trim().length > 0
  )

  if (completedBranches.length === 0) {
    return null
  }

  return streamText(
    buildJudgePrompt({
      prompt,
      branches: completedBranches
    })
  )
}
