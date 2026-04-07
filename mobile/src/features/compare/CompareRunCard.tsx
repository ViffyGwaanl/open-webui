import { useState } from 'react'
import { StyleSheet, View } from 'react-native'

import type { ThreadTimelineCompareRunItem } from '../../services/ThreadService'
import { BranchPanel } from './BranchPanel'
import { CompareBranchActions } from './CompareBranchActions'
import { BranchTabs } from './BranchTabs'
import { JudgeSummaryCard } from './JudgeSummaryCard'

type CompareRunCardProps = {
  run: ThreadTimelineCompareRunItem
  onContinueBranch?: (branch: ThreadTimelineCompareRunItem['branches'][number]) => void
  onCopyBranch?: (branch: ThreadTimelineCompareRunItem['branches'][number]) => void
  onExportRun?: (run: ThreadTimelineCompareRunItem) => void
}

export function CompareRunCard({
  run,
  onContinueBranch,
  onCopyBranch,
  onExportRun
}: CompareRunCardProps) {
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(run.branches[0]?.id ?? null)
  const selectedBranch =
    run.branches.find((branch) => branch.id === selectedBranchId) ?? run.branches[0] ?? null

  return (
    <View style={styles.card}>
      <JudgeSummaryCard summary={run.judgeSummary} />
      <BranchTabs
        branches={run.branches.map((branch) => ({
          id: branch.id,
          modelId: branch.modelId,
          status: branch.status
        }))}
        selectedBranchId={selectedBranchId}
        onSelect={setSelectedBranchId}
      />
      {selectedBranch ? (
        <CompareBranchActions
          onContinue={onContinueBranch ? () => onContinueBranch(selectedBranch) : undefined}
          onCopy={onCopyBranch ? () => onCopyBranch(selectedBranch) : undefined}
          onExport={onExportRun ? () => onExportRun(run) : undefined}
        />
      ) : null}
      {selectedBranch ? <BranchPanel branch={selectedBranch} /> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb'
  }
})
