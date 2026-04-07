import { useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'

import { DocumentDetailScreen } from '../../src/features/library/DocumentDetailScreen'
import { RagSingleTurnExecutionService } from '../../src/services/RagSingleTurnExecutionService'

const ragService = new RagSingleTurnExecutionService()

export default function LibraryDocumentRoute() {
  const params = useLocalSearchParams<{ documentId?: string | string[] }>()
  const documentId = Array.isArray(params.documentId) ? params.documentId[0] : params.documentId
  const [document, setDocument] = useState<Awaited<ReturnType<typeof ragService.getDocumentDetail>>>(null)

  useEffect(() => {
    if (!documentId) {
      setDocument(null)
      return
    }

    void ragService.getDocumentDetail(documentId).then((detail) => {
      setDocument(detail)
    })
  }, [documentId])

  return <DocumentDetailScreen document={document} />
}
