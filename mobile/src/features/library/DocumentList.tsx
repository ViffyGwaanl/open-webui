import { StyleSheet, View } from 'react-native'

import { DocumentRow, type LibraryDocumentSummary } from './DocumentRow'

export function DocumentList({ documents }: { documents: LibraryDocumentSummary[] }) {
  return (
    <View style={styles.list}>
      {documents.map((document) => (
        <DocumentRow key={document.id} document={document} />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  list: {
    gap: 12
  }
})
