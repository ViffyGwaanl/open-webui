import { StyleSheet, Text, View } from 'react-native'

type DocumentDetailScreenProps = {
  document: {
    id: string
    displayName: string
    fileType: string
    storageUri: string
    pageCount: number | null
    textLength: number | null
    indexStatus: string
    outline: Array<{
      depth: number
      title: string
    }>
    normalizedText: string
    chunkCount: number
  } | null
}

export function DocumentDetailScreen({ document }: DocumentDetailScreenProps) {
  if (!document) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Document not found</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{document.displayName}</Text>
      <View style={styles.metaCard}>
        <Text style={styles.meta}>{document.fileType.toUpperCase()}</Text>
        <Text style={styles.meta}>{`${document.chunkCount} chunks`}</Text>
        <Text style={styles.meta}>{`${document.textLength ?? 0} chars`}</Text>
        {document.pageCount !== null ? <Text style={styles.meta}>{`${document.pageCount} pages`}</Text> : null}
        <Text style={styles.meta}>{`Status: ${document.indexStatus}`}</Text>
      </View>
      {document.outline.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Outline</Text>
          {document.outline.map((entry) => (
            <Text key={`${entry.depth}:${entry.title}`} style={styles.outlineEntry}>
              {entry.title}
            </Text>
          ))}
        </View>
      ) : null}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Excerpt</Text>
        <Text style={styles.body}>{document.normalizedText}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 16
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a'
  },
  metaCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    gap: 6
  },
  meta: {
    color: '#475569'
  },
  section: {
    gap: 8
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a'
  },
  outlineEntry: {
    color: '#334155'
  },
  body: {
    color: '#0f172a',
    lineHeight: 22
  }
})
