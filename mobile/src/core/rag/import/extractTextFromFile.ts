import * as FileSystem from 'expo-file-system/legacy'

import type { ExtractedDocumentText, SupportedRagFileType } from '../types'

import { extractDocumentText } from './extractText'
import { extractPdfPagesFromFile } from './pdfTextExtractor'

type ExtractTextFromFileInput = {
  uri: string
  name: string
  fileType: SupportedRagFileType
}

export async function extractTextFromFile(input: ExtractTextFromFileInput): Promise<ExtractedDocumentText> {
  if (input.fileType === 'pdf') {
    const pages = await extractPdfPagesFromFile(input.uri)

    return extractDocumentText({
      fileType: 'pdf',
      pages
    })
  }

  const rawText = await FileSystem.readAsStringAsync(input.uri)

  return extractDocumentText({
    fileType: input.fileType,
    rawText
  })
}
