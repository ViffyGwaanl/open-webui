import { describe, expect, it, jest } from '@jest/globals'

import { DocumentIndexingService } from '../DocumentIndexingService'

describe('DocumentIndexingService', () => {
  it('chunks extracted text, embeds it, stores chunks, and completes the index job', async () => {
    const repository = {
      loadDocumentForIndexing: jest.fn(async () => ({
        document: { id: 'doc-1', embeddingModelId: 'text-embedding-3-small', embeddingProviderId: 'openai-main' },
        text: {
          normalizedText: '# Intro\n\nHello world.\n\n## Details\n\nMore context.',
          outlineJson: JSON.stringify([
            { depth: 1, title: 'Intro' },
            { depth: 2, title: 'Details' }
          ]),
          pageMapJson: '[]'
        },
        job: { id: 'job-1' }
      })),
      replaceDocumentChunks: jest.fn(async () => {}),
      updateIndexJob: jest.fn(async () => {}),
      now: () => 200
    }
    const embeddingGateway = {
      embedTexts: jest.fn(async ({ texts }: { texts: string[] }) => texts.map(() => [0.1, 0.2, 0.3]))
    }
    const service = new DocumentIndexingService({
      repository: repository as never,
      embeddingGateway: embeddingGateway as never,
      createId: (() => {
        let index = 0
        const ids = ['chunk-1', 'chunk-2']
        return () => ids[index++]!
      })()
    })

    await service.indexDocument('doc-1')

    expect(embeddingGateway.embedTexts).toHaveBeenCalled()
    expect(repository.replaceDocumentChunks).toHaveBeenCalledWith(
      'doc-1',
      expect.arrayContaining([
        expect.objectContaining({ id: 'chunk-1', sectionTitle: 'Intro' })
      ])
    )
    expect(repository.updateIndexJob).toHaveBeenLastCalledWith(
      'job-1',
      expect.objectContaining({ status: 'completed' })
    )
  })
})
