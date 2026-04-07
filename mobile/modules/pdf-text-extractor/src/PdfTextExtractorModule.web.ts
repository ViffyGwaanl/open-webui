import type { ExtractedPdfPage } from './PdfTextExtractor.types'

export default {
  async extractText(_uri: string): Promise<ExtractedPdfPage[]> {
    throw new Error('PDF extraction is not available on web in this local-first build')
  }
}
