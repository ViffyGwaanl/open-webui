import type { ExtractedPdfPage } from '../types'

type PdfTextExtractorModuleType = {
  extractText: (uri: string) => Promise<ExtractedPdfPage[]>
}

function loadPdfTextExtractorModule(): PdfTextExtractorModuleType {
  const module = require('../../../../modules/pdf-text-extractor') as {
    default?: PdfTextExtractorModuleType
  } & PdfTextExtractorModuleType

  return module.default ?? module
}

export async function extractPdfPagesFromFile(uri: string): Promise<ExtractedPdfPage[]> {
  return loadPdfTextExtractorModule().extractText(uri)
}
