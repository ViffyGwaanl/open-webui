import { StyleSheet, Text, View } from 'react-native'

import type { ThreadTimelineCompareRunItem, ThreadTimelineItem } from '../../services/ThreadService'
import { CompareRunCard } from '../compare/CompareRunCard'

type MessageListProps = {
  items: ThreadTimelineItem[]
  onContinueCompareBranch?: (input: { compareRunId: string; branchId: string }) => void | Promise<void>
  onCopyCompareBranch?: (input: {
    compareRunId: string
    branchId: string
    text: string
  }) => void | Promise<void>
  onExportCompareRun?: (run: ThreadTimelineCompareRunItem) => void | Promise<void>
}

export function MessageList({
  items,
  onContinueCompareBranch,
  onCopyCompareBranch,
  onExportCompareRun
}: MessageListProps) {
  return (
    <View style={styles.list}>
      {items.map((item) =>
        item.kind === 'compare_run' ? (
          <CompareRunCard
            key={item.id}
            run={item}
            onContinueBranch={
              onContinueCompareBranch
                ? (branch) => onContinueCompareBranch({ compareRunId: item.id, branchId: branch.id })
                : undefined
            }
            onCopyBranch={
              onCopyCompareBranch
                ? (branch) =>
                    onCopyCompareBranch({
                      compareRunId: item.id,
                      branchId: branch.id,
                      text: branch.text
                    })
                : undefined
            }
            onExportRun={onExportCompareRun}
          />
        ) : (
          <Text key={item.id} style={styles.message}>
            {item.text}
          </Text>
        )
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    gap: 8
  },
  message: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f3f4f6'
  }
})
