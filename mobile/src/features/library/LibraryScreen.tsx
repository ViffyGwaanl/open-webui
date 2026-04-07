import { StyleSheet, Text, View } from 'react-native'

import { DocumentImportButton } from './DocumentImportButton'
import { DocumentList } from './DocumentList'
import type { LibraryDocumentSummary } from './DocumentRow'

type LibraryScreenProps = {
  documents: LibraryDocumentSummary[]
  onImportPress: () => void | Promise<void>
}

export function LibraryScreen({ documents, onImportPress }: LibraryScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Library</Text>
      <Text style={styles.body}>Import local text, markdown, and PDF sources for on-device retrieval.</Text>
      <DocumentImportButton onPress={onImportPress} />
      <DocumentList documents={documents} />
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
  body: {
    color: '#475569',
    lineHeight: 22
  }
})
