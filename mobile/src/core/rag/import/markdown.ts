import type { ExtractedDocumentText, OutlineEntry } from '../types'

function normalizeLine(line: string) {
  return line.replace(/^#+\s+/, '').trim()
}

export function extractMarkdownText(rawText: string): ExtractedDocumentText {
  const normalizedSource = rawText.replace(/\r\n/g, '\n').trim()
  const outline: OutlineEntry[] = []
  const plainText = normalizedSource
    .split('\n')
    .map((line) => {
      const match = /^(#+)\s+(.*)$/.exec(line.trim())

      if (match) {
        outline.push({
          depth: match[1].length,
          title: match[2].trim()
        })
      }

      return normalizeLine(line)
    })
    .join('\n')
    .trim()

  return {
    plainText,
    outline,
    pages: [],
    textLength: plainText.length,
    pageCount: null
  }
}
