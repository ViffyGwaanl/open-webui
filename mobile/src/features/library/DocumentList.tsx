import { StyleSheet, View } from 'react-native'

import { DocumentRow, type LibraryDocumentSummary } from './DocumentRow'

export function DocumentList({
  documents,
  onSelectDocument
}: {
  documents: LibraryDocumentSummary[]
  onSelectDocument?: (documentId: string) => void
}) {
  return (
    <View style={styles.list}>
      {documents.map((document) => (
        <DocumentRow
          key={document.id}
          document={document}
          onPress={onSelectDocument}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  list: {
    gap: 12
  }
})
