export type SupportedRagFileType = 'txt' | 'md' | 'pdf'

export type OutlineEntry = {
  depth: number
  title: string
}

export type ExtractedPdfPage = {
  pageNumber: number
  text: string
}

export type ExtractedDocumentText = {
  plainText: string
  outline: OutlineEntry[]
  pages: ExtractedPdfPage[]
  textLength: number
  pageCount: number | null
}

export type DocumentChunkDraft = {
  sectionTitle: string | null
  text: string
  startOffset: number
  endOffset: number
  pageNumber: number | null
}

export type RetrievalCandidate = {
  id: string
  documentId: string
  sourceLabel: string
  snippetText: string
  sectionTitle: string | null
  pageNumber: number | null
  keywordScore: number
  embedding: number[]
}

export type RetrievedSnippet = {
  id: string
  documentId: string
  sourceLabel: string
  snippetText: string
  sectionTitle: string | null
  pageNumber: number | null
}

export type RetrievalContext = {
  snippets: RetrievedSnippet[]
}

export type ExtractDocumentInput =
  | {
      fileType: 'txt' | 'md'
      rawText: string
    }
  | {
      fileType: 'pdf'
      pages: ExtractedPdfPage[]
    }
