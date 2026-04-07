type JudgePromptBranch = {
  providerLabel: string
  modelLabel: string
  text: string
}

type BuildJudgePromptInput = {
  prompt: string
  branches: JudgePromptBranch[]
}

export function buildJudgePrompt({ prompt, branches }: BuildJudgePromptInput) {
  const branchSections = branches
    .map(
      (branch, index) =>
        `Candidate ${index + 1} (${branch.providerLabel} / ${branch.modelLabel})\n${branch.text}`
    )
    .join('\n\n')

  return `User prompt:\n${prompt}\n\nEvaluate the following model answers and produce a concise comparison summary.\n\n${branchSections}`
}
