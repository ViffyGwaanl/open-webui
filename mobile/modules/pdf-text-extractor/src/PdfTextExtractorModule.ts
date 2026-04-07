import { requireNativeModule } from 'expo'

import type { ExtractedPdfPage } from './PdfTextExtractor.types'

type PdfTextExtractorModuleType = {
  extractText(uri: string): Promise<ExtractedPdfPage[]>
}

export default requireNativeModule<PdfTextExtractorModuleType>('PdfTextExtractor')
