import {
  documentChunks,
  documentChunksFts,
  documents,
  documentTexts,
  indexJobs
} from '../index'

describe('local rag index schema', () => {
  it('exports the dedicated document indexing tables', () => {
    expect(documents.importStatus).toBeDefined()
    expect(documentTexts.normalizedText).toBeDefined()
    expect(documentChunks.embeddingBlob).toBeDefined()
    expect(documentChunksFts.rowid).toBeDefined()
    expect(indexJobs.status).toBeDefined()
  })
})
