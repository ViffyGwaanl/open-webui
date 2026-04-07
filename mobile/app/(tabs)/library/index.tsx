import * as DocumentPicker from 'expo-document-picker'
import { Alert } from 'react-native'
import { useEffect, useState } from 'react'

import { LibraryScreen } from '../../../src/features/library/LibraryScreen'
import { RagSingleTurnExecutionService } from '../../../src/services/RagSingleTurnExecutionService'

const ragService = new RagSingleTurnExecutionService()

export default function LibraryIndexScreen() {
  const [documents, setDocuments] = useState<
    Array<{
      id: string
      displayName: string
      fileType: string
      indexStatus: string
      textLength: number
      pageCount: number | null
    }>
  >([])

  const loadDocuments = async () => {
    setDocuments(await ragService.listDocuments())
  }

  useEffect(() => {
    void loadDocuments()
  }, [])

  return (
    <LibraryScreen
      documents={documents}
      onImportPress={async () => {
        try {
          const result = await DocumentPicker.getDocumentAsync({
            type: ['text/plain', 'text/markdown', 'application/pdf'],
            copyToCacheDirectory: true,
            multiple: false
          })

          if (result.canceled || result.assets.length === 0) {
            return
          }

          const [asset] = result.assets

          await ragService.importDocument({
            uri: asset.uri,
            name: asset.name,
            mimeType: asset.mimeType
          })
          await loadDocuments()
        } catch (error) {
          Alert.alert('Import failed', error instanceof Error ? error.message : 'Unknown error')
        }
      }}
    />
  )
}
