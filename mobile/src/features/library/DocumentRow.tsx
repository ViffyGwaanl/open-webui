import { StyleSheet, Text, View } from 'react-native'

import { IndexJobBadge } from './IndexJobBadge'

export type LibraryDocumentSummary = {
  id: string
  displayName: string
  fileType: string
  indexStatus: string
  textLength: number
  pageCount: number | null
}

export function DocumentRow({ document }: { document: LibraryDocumentSummary }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{document.displayName}</Text>
      <Text style={styles.meta}>{document.fileType.toUpperCase()}</Text>
      <Text style={styles.meta}>{document.textLength} chars</Text>
      {document.pageCount !== null ? <Text style={styles.meta}>{document.pageCount} pages</Text> : null}
      <IndexJobBadge status={document.indexStatus} />
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    gap: 6
  },
  title: {
    fontWeight: '700',
    color: '#0f172a'
  },
  meta: {
    color: '#475569'
  }
})
