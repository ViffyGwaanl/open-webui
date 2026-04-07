import { useState } from 'react'
import { StyleSheet, View } from 'react-native'

import type { ThreadTimelineCompareRunItem } from '../../services/ThreadService'
import { BranchPanel } from './BranchPanel'
import { BranchTabs } from './BranchTabs'
import { JudgeSummaryCard } from './JudgeSummaryCard'

export function CompareRunCard({ run }: { run: ThreadTimelineCompareRunItem }) {
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
