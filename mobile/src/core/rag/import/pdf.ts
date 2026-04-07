import type { ExtractedDocumentText, ExtractedPdfPage } from '../types'

export function extractPdfText(pages: ExtractedPdfPage[]): ExtractedDocumentText {
  const normalizedPages = pages.map((page) => ({
    ...page,
    text: page.text.replace(/\r\n/g, '\n').trim()
  }))
  const plainText = normalizedPages.map((page) => page.text).join('\n\n').trim()

  return {
    plainText,
    outline: [],
    pages: normalizedPages,
    textLength: plainText.length,
    pageCount: normalizedPages.length
  }
}
