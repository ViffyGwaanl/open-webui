import type { ExtractedDocumentText } from '../types'

function normalizeText(value: string) {
  return value.replace(/\r\n/g, '\n').trim()
}

export function extractTxtText(rawText: string): ExtractedDocumentText {
  const plainText = normalizeText(rawText)

  return {
    plainText,
    outline: [],
    pages: [],
    textLength: plainText.length,
    pageCount: null
  }
}
