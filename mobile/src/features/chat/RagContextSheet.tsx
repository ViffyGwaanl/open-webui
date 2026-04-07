import { StyleSheet, Text, View } from 'react-native'

import type { RetrievalContext } from '../../core/rag/types'

export function RagContextSheet({ context }: { context: RetrievalContext }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Retrieved Evidence</Text>
      {context.snippets.map((snippet) => (
        <View key={snippet.id} style={styles.row}>
          <Text style={styles.source}>{snippet.sourceLabel}</Text>
          <Text style={styles.snippet}>{snippet.snippetText}</Text>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    gap: 8
  },
  title: {
    fontWeight: '700',
    color: '#1e3a8a'
  },
  row: {
    gap: 4
  },
  source: {
    fontWeight: '600',
    color: '#1d4ed8'
  },
  snippet: {
    color: '#334155'
  }
})
