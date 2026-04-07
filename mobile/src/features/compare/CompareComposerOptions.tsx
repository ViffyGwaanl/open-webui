import { StyleSheet, Text, View } from 'react-native'

export type ActiveComparePresetSummary = {
  name: string
  branchCount: number
  sharedContextEnabled: boolean
}

type CompareComposerOptionsProps = {
  activePreset?: ActiveComparePresetSummary | null
}

export function CompareComposerOptions({ activePreset = null }: CompareComposerOptionsProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Compare Mode</Text>
      <Text style={styles.body}>Run multiple model answers side by side and inspect each branch.</Text>
      {activePreset ? (
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>{activePreset.name}</Text>
          <Text style={styles.metaValue}>{`${activePreset.branchCount} branch${activePreset.branchCount === 1 ? '' : 'es'}`}</Text>
          <Text style={styles.metaValue}>
            {activePreset.sharedContextEnabled ? 'Shared RAG context on' : 'Shared RAG context off'}
          </Text>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#eef2ff',
    gap: 4
  },
  title: {
    fontWeight: '600',
    color: '#312e81'
  },
  body: {
    fontSize: 13,
    lineHeight: 20,
    color: '#4338ca'
  },
  metaRow: {
    gap: 2
  },
  metaLabel: {
    fontWeight: '700',
    color: '#312e81'
  },
  metaValue: {
    fontSize: 12,
    color: '#4338ca'
  }
})
