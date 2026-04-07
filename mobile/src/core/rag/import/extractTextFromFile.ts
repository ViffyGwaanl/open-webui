import * as FileSystem from 'expo-file-system/legacy'

import type { ExtractedDocumentText, SupportedRagFileType } from '../types'

import { extractDocumentText } from './extractText'

type ExtractTextFromFileInput = {
  uri: string
  name: string
  fileType: SupportedRagFileType
}

export async function extractTextFromFile(input: ExtractTextFromFileInput): Promise<ExtractedDocumentText> {
  if (input.fileType === 'pdf') {
    throw new Error('PDF extraction is not configured yet in this native build')
  }

  const rawText = await FileSystem.readAsStringAsync(input.uri)

  return extractDocumentText({
    fileType: input.fileType,
    rawText
  })
}
