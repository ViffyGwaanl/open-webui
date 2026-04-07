import { describe, expect, it } from '@jest/globals'

import { chunkDocument } from '../chunkDocument'

describe('chunkDocument', () => {
  it('prefers heading and paragraph boundaries before falling back to windows', () => {
    const chunks = chunkDocument({
      plainText:
        '# Intro\n\nShort introduction.\n\n## Deep Dive\n\nThis is a much longer paragraph that should stay grouped with its heading. '.repeat(
          8
        ),
      outline: [
        { depth: 1, title: 'Intro' },
        { depth: 2, title: 'Deep Dive' }
      ],
      pageCount: null
    })

    expect(chunks[0]?.sectionTitle).toBe('Intro')
    expect(chunks.some((chunk) => chunk.sectionTitle === 'Deep Dive')).toBe(true)
    expect(chunks.every((chunk) => chunk.text.length <= 1400)).toBe(true)
  })
})
