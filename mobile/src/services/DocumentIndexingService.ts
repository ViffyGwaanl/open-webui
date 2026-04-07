import { chunkDocument } from '../core/rag/chunking/chunkDocument'

type DocumentIndexingRepository = {
  loadDocumentForIndexing: (documentId: string) => Promise<{
    document: { id: string; embeddingModelId: string; embeddingProviderId: string }
    text: { normalizedText: string; outlineJson: string; pageMapJson: string }
    job: { id: string }
  }>
  replaceDocumentChunks: (
    documentId: string,
    chunks: Array<{
      id: string
      documentId: string
      ftsRowId: number | null
      startOffset: number
      endOffset: number
      pageNumber: number | null
      sectionTitle: string | null
      chunkText: string
      tokenEstimate: number
      embeddingBlob: string
      embeddingDimension: number
      embeddingModelId: string
      embeddingProviderId: string
      createdAt: number
      updatedAt: number
    }>
  ) => Promise<void>
  updateIndexJob: (jobId: string, patch: {
    status: string
    attemptCount?: number
    lastErrorJson?: string
    lastProgressAt?: number | null
    updatedAt?: number
  }) => Promise<void>
  updateDocument: (
    documentId: string,
    patch: {
      indexStatus?: string
      updatedAt?: number
    }
  ) => Promise<void>
}

type EmbeddingGateway = {
  embedTexts: (args: {
    providerProfileId: string
    modelId: string
    texts: string[]
  }) => Promise<number[][]>
}

type DocumentIndexingServiceDeps = {
  repository: DocumentIndexingRepository
  embeddingGateway: EmbeddingGateway
  createId?: () => string
  now?: () => number
}

function createRandomId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export class DocumentIndexingService {
  private readonly repository: DocumentIndexingRepository
  private readonly embeddingGateway: EmbeddingGateway
  private readonly createId: () => string
  private readonly now: () => number

  constructor({
    repository,
    embeddingGateway,
    createId = createRandomId,
    now = () => Date.now()
  }: DocumentIndexingServiceDeps) {
    this.repository = repository
    this.embeddingGateway = embeddingGateway
    this.createId = createId
    this.now = now
  }

  async indexDocument(documentId: string) {
    const loaded = await this.repository.loadDocumentForIndexing(documentId)
    const startedAt = this.now()
    await this.repository.updateDocument(documentId, {
      indexStatus: 'indexing',
      updatedAt: startedAt
    })
    await this.repository.updateIndexJob(loaded.job.id, {
      status: 'running',
      attemptCount: 1,
      lastErrorJson: '{}',
      lastProgressAt: startedAt,
      updatedAt: startedAt
    })
    const outline = JSON.parse(loaded.text.outlineJson) as Array<{ depth: number; title: string }>
    try {
      const chunks = chunkDocument({
        plainText: loaded.text.normalizedText,
        outline,
        pageCount: null
      })
      const embeddings = await this.embeddingGateway.embedTexts({
        providerProfileId: loaded.document.embeddingProviderId,
        modelId: loaded.document.embeddingModelId,
        texts: chunks.map((chunk) => chunk.text)
      })
      const now = this.now()

      await this.repository.replaceDocumentChunks(
        documentId,
        chunks.map((chunk, index) => ({
          id: this.createId(),
          documentId,
          ftsRowId: null,
          startOffset: chunk.startOffset,
          endOffset: chunk.endOffset,
          pageNumber: chunk.pageNumber,
          sectionTitle: chunk.sectionTitle,
          chunkText: chunk.text,
          tokenEstimate: Math.ceil(chunk.text.length / 4),
          embeddingBlob: JSON.stringify(embeddings[index] ?? []),
          embeddingDimension: embeddings[index]?.length ?? 0,
          embeddingModelId: loaded.document.embeddingModelId,
          embeddingProviderId: loaded.document.embeddingProviderId,
          createdAt: now,
          updatedAt: now
        }))
      )
      await this.repository.updateIndexJob(loaded.job.id, {
        status: 'completed',
        lastProgressAt: now,
        updatedAt: now
      })
    } catch (error) {
      const failedAt = this.now()
      await this.repository.updateDocument(documentId, {
        indexStatus: 'pending',
        updatedAt: failedAt
      })
      await this.repository.updateIndexJob(loaded.job.id, {
        status: 'failed',
        lastErrorJson: JSON.stringify({
          message: error instanceof Error ? error.message : 'Unknown indexing error'
        }),
        lastProgressAt: failedAt,
        updatedAt: failedAt
      })
      throw error
    }
  }
}
