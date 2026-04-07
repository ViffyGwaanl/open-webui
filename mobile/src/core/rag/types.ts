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

export type ExtractDocumentInput =
  | {
      fileType: 'txt' | 'md'
      rawText: string
    }
  | {
      fileType: 'pdf'
      pages: ExtractedPdfPage[]
    }
