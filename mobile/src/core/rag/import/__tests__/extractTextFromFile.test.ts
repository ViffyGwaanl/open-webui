import { describe, expect, it, jest } from '@jest/globals'

jest.mock('expo-file-system/legacy', () => ({
  readAsStringAsync: jest.fn(async () => '# Intro\n\nHello')
}))

jest.mock('../pdfTextExtractor', () => ({
  extractPdfPagesFromFile: jest.fn(async () => [
    {
      pageNumber: 1,
      text: 'Page one'
    },
    {
      pageNumber: 2,
      text: 'Page two'
    }
  ])
}))

import { extractTextFromFile } from '../extractTextFromFile'

describe('extractTextFromFile', () => {
  it('reads markdown/text files through the file system', async () => {
    await expect(
      extractTextFromFile({
        uri: 'file:///guide.md',
        name: 'guide.md',
        fileType: 'md'
      })
    ).resolves.toMatchObject({
      plainText: expect.stringContaining('Intro'),
      pageCount: null
    })
  })

  it('extracts pdf pages through the native pdf text extractor', async () => {
    await expect(
      extractTextFromFile({
        uri: 'file:///guide.pdf',
        name: 'guide.pdf',
        fileType: 'pdf'
      })
    ).resolves.toMatchObject({
      pageCount: 2,
      plainText: expect.stringContaining('Page one')
    })
  })
})
