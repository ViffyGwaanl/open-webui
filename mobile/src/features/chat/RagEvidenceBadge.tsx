import { StyleSheet, Text, View } from 'react-native'

import type { RetrievalContext } from '../../core/rag/types'

export function RagEvidenceBadge({ context }: { context: RetrievalContext }) {
  const label = `${context.snippets.length} source${context.snippets.length === 1 ? '' : 's'} attached`

  return (
    <View style={styles.badge}>
      <Text style={styles.label}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#dbeafe'
  },
  label: {
    color: '#1d4ed8',
    fontWeight: '600'
  }
})
