import type { ExtractDocumentInput } from '../types'

import { extractMarkdownText } from './markdown'
import { extractPdfText } from './pdf'
import { extractTxtText } from './txt'

export function extractDocumentText(input: ExtractDocumentInput) {
  switch (input.fileType) {
    case 'txt':
      return extractTxtText(input.rawText)
    case 'md':
      return extractMarkdownText(input.rawText)
    case 'pdf':
      return extractPdfText(input.pages)
  }
}
