import { describe, expect, it, jest } from '@jest/globals'

import { DocumentImportService } from '../DocumentImportService'

describe('DocumentImportService', () => {
  it('copies a markdown file into managed storage and seeds the index metadata', async () => {
    const store = {
      copyIntoManagedStorage: jest.fn(async () => ({
        storageUri: 'file:///managed/guide.md',
        checksum: 'abc123',
        fileSize: 256
      }))
    }
    const repository = {
      insertDocument: jest.fn(),
      insertDocumentText: jest.fn(),
      insertIndexJob: jest.fn()
    }
    const service = new DocumentImportService({
      store: store as never,
      repository: repository as never,
      createId: (() => {
        let index = 0
        const ids = ['doc-1', 'doc-text-1', 'job-1']
        return () => ids[index++]!
      })(),
      now: () => 100,
      extractText: (input) =>
        Promise.resolve({
          plainText: `Extracted: ${input.name}`,
          outline: [{ depth: 1, title: 'Guide' }],
          pages: [],
          textLength: 19,
          pageCount: null
        })
    })

    const result = await service.importDocument({
      uri: 'file:///incoming/guide.md',
      name: 'guide.md',
      fileType: 'md'
    })

    expect(store.copyIntoManagedStorage).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'guide.md'
      })
    )
    expect(repository.insertDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'doc-1',
        displayName: 'guide.md',
        fileType: 'md',
        importStatus: 'imported',
        indexStatus: 'pending'
      })
    )
    expect(repository.insertDocumentText).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'doc-text-1',
        documentId: 'doc-1',
        normalizedText: 'Extracted: guide.md'
      })
    )
    expect(repository.insertIndexJob).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'job-1',
        documentId: 'doc-1',
        status: 'pending'
      })
    )
    expect(result).toEqual(
      expect.objectContaining({
        id: 'doc-1',
        fileType: 'md'
      })
    )
  })
})
