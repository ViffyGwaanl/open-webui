import { describe, expect, it } from '@jest/globals'

import { extractDocumentText } from '../import/extractText'

describe('extractDocumentText', () => {
  it('normalizes markdown into plain text while preserving heading outline', () => {
    const result = extractDocumentText({
      fileType: 'md',
      rawText: '# Intro\n\nHello world.\n\n## Details\n\nMore context.'
    })

    expect(result.plainText).toContain('Intro')
    expect(result.plainText).toContain('More context.')
    expect(result.outline).toEqual([
      { depth: 1, title: 'Intro' },
      { depth: 2, title: 'Details' }
    ])
  })

  it('flattens pdf pages into one normalized plain text payload', () => {
    const result = extractDocumentText({
      fileType: 'pdf',
      pages: [
        { pageNumber: 1, text: 'Page one text.' },
        { pageNumber: 2, text: 'Page two text.' }
      ]
    })

    expect(result.pageCount).toBe(2)
    expect(result.plainText).toContain('Page one text.')
    expect(result.plainText).toContain('Page two text.')
  })
})
