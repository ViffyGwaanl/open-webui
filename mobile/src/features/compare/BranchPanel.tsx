import { StyleSheet, Text, View } from 'react-native'

type BranchPanelProps = {
  branch: {
    modelId: string
    status: string
    text: string
  }
}

export function BranchPanel({ branch }: BranchPanelProps) {
  return (
    <View style={styles.panel}>
      <Text style={styles.heading}>{branch.modelId}</Text>
      <Text style={styles.status}>Status: {branch.status}</Text>
      <Text style={styles.body}>{branch.text || 'No response yet.'}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  panel: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#f9fafb',
    gap: 8
  },
  heading: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827'
  },
  status: {
    fontSize: 12,
    color: '#6b7280'
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
    color: '#111827'
  }
})
