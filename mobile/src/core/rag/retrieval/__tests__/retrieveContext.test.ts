import { describe, expect, it } from '@jest/globals'

import { retrieveContext } from '../retrieveContext'

describe('retrieveContext', () => {
  it('reranks candidates with vector similarity and mmr deduplication', () => {
    const result = retrieveContext({
      topK: 2,
      queryEmbedding: [1, 0, 0],
      candidates: [
        {
          id: 'chunk-1',
          documentId: 'doc-1',
          sourceLabel: 'guide.md',
          snippetText: 'Architecture overview',
          sectionTitle: 'Intro',
          pageNumber: null,
          keywordScore: 0.5,
          embedding: [0.98, 0.02, 0]
        },
        {
          id: 'chunk-2',
          documentId: 'doc-1',
          sourceLabel: 'guide.md',
          snippetText: 'Architecture details',
          sectionTitle: 'Deep Dive',
          pageNumber: null,
          keywordScore: 0.45,
          embedding: [0.97, 0.03, 0]
        },
        {
          id: 'chunk-3',
          documentId: 'doc-2',
          sourceLabel: 'notes.txt',
          snippetText: 'Mobile release workflow',
          sectionTitle: null,
          pageNumber: null,
          keywordScore: 0.3,
          embedding: [0.55, 0.83, 0.02]
        }
      ]
    })

    expect(result.snippets).toHaveLength(2)
    expect(result.snippets[0]?.id).toBe('chunk-1')
    expect(result.snippets.some((snippet) => snippet.id === 'chunk-3')).toBe(true)
  })
})
