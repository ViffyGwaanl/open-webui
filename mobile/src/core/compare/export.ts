type ExportableCompareBranch = {
  modelLabel: string
  status: string
  text: string
}

type ExportableCompareRun = {
  prompt: string
  judgeSummary: string | null
  branches: ExportableCompareBranch[]
}

export function exportCompareRunMarkdown({
  prompt,
  judgeSummary,
  branches
}: ExportableCompareRun) {
  const sections = [
    '# Compare Run',
    '',
    '## Prompt',
    '',
    prompt,
    '',
    '## Judge Summary',
    '',
    judgeSummary ?? 'Not generated',
    ''
  ]
  const branchSections = branches
    .filter((branch) => branch.status === 'completed' && branch.text.trim().length > 0)
    .flatMap((branch) => ['## ' + branch.modelLabel, '', branch.text, ''])

  return [...sections, ...branchSections].join('\n')
}
