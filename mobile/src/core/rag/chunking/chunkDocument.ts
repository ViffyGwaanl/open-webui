import type { DocumentChunkDraft, ExtractedDocumentText } from '../types'

const DEFAULTS = {
  targetChars: 900,
  maxChars: 1400,
  minChars: 220,
  overlapChars: 120
} as const

type ChunkDocumentInput = Pick<ExtractedDocumentText, 'plainText' | 'outline' | 'pageCount'>

function splitParagraphs(plainText: string) {
  return plainText
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
}

function resolveSectionTitle(paragraph: string) {
  const lines = paragraph.split('\n')
  const firstLine = lines[0]?.trim() ?? ''
  const normalizedHeading = firstLine.replace(/^#+\s+/, '').trim()

  return normalizedHeading.length > 0 && !normalizedHeading.includes('.') && normalizedHeading.length < 80
    ? normalizedHeading
    : null
}

export function chunkDocument({ plainText }: ChunkDocumentInput): DocumentChunkDraft[] {
  const paragraphs = splitParagraphs(plainText)
  const chunks: DocumentChunkDraft[] = []
  let cursor = 0
  let currentText = ''
  let currentSectionTitle: string | null = null
  let chunkStart = 0

  const flush = () => {
    const text = currentText.trim()

    if (!text) {
      return
    }

    chunks.push({
      sectionTitle: currentSectionTitle,
      text,
      startOffset: chunkStart,
      endOffset: chunkStart + text.length,
      pageNumber: null
    })
    currentText = ''
    currentSectionTitle = null
    chunkStart = cursor
  }

  paragraphs.forEach((paragraph) => {
    const sectionTitle = resolveSectionTitle(paragraph)
    const nextText = currentText ? `${currentText}\n\n${paragraph}` : paragraph
    const shouldStartNewChunk =
      currentText.length >= DEFAULTS.minChars &&
      (nextText.length > DEFAULTS.maxChars || (sectionTitle && sectionTitle !== currentSectionTitle))

    if (shouldStartNewChunk) {
      flush()
    }

    if (!currentText) {
      currentSectionTitle = sectionTitle
      chunkStart = cursor
      currentText = paragraph
    } else {
      currentText = `${currentText}\n\n${paragraph}`
    }

    if (currentText.length >= DEFAULTS.targetChars) {
      flush()
    }

    cursor += paragraph.length + 2
  })

  flush()

  return chunks
}
