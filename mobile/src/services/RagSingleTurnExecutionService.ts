import { DocumentIndexingService } from './DocumentIndexingService'
import { DocumentImportService } from './DocumentImportService'
import { DefaultModelSelectionService } from './DefaultModelSelectionService'
import { ProviderRuntimeService } from './ProviderRuntimeService'
import { RetrievalService } from './RetrievalService'
import { RunSingleTurnWithRagService } from './RunSingleTurnWithRagService'
import { ThreadService } from './ThreadService'
import { TurnEvidenceService } from './TurnEvidenceService'
import { RagIndexRepository } from '../storage/index-db/repositories/RagIndexRepository'
import { TurnEvidenceRepository } from '../storage/db/repositories/TurnEvidenceRepository'
import { ImportedDocumentStore } from '../storage/files/ImportedDocumentStore'

type SupportedRagFileType = 'txt' | 'md' | 'pdf'

function inferFileType(name: string, mimeType: string | null | undefined): SupportedRagFileType {
  const lowerName = name.toLowerCase()
  const lowerMimeType = (mimeType ?? '').toLowerCase()

  if (lowerMimeType.includes('pdf') || lowerName.endsWith('.pdf')) {
    return 'pdf'
  }

  if (lowerMimeType.includes('markdown') || lowerName.endsWith('.md')) {
    return 'md'
  }

  return 'txt'
}

export class RagSingleTurnExecutionService {
  private readonly selectionService = new DefaultModelSelectionService()
  private readonly providerRuntimeService = new ProviderRuntimeService()
  private readonly indexRepository = new RagIndexRepository()
  private readonly threadService = new ThreadService()
  private readonly turnEvidenceService = new TurnEvidenceService({
    repository: new TurnEvidenceRepository()
  })

  async run({ threadId, prompt }: { threadId: string; prompt: string }) {
    const chatTarget = await this.selectionService.resolveSingleChatTarget()
    const embeddingTarget = await this.selectionService.resolveEmbeddingTarget()
    const retrievalService = new RetrievalService({
      repository: this.indexRepository,
      embeddingGateway: this.providerRuntimeService,
      embeddingProviderProfileId: embeddingTarget.providerProfileId,
      embeddingModelId: embeddingTarget.modelId
    })
    const service = new RunSingleTurnWithRagService({
      retrievalService,
      turnEvidenceService: this.turnEvidenceService,
      threadService: this.threadService
    })

    return service.run({
      threadId,
      prompt,
      streamText: (request, sink) =>
        this.providerRuntimeService.streamText(
          {
            providerProfileId: chatTarget.providerProfileId,
            modelId: chatTarget.modelId,
            prompt: request.prompt
          },
          sink
        )
    })
  }

  async listDocuments() {
    return this.indexRepository.listDocuments()
  }

  async importDocument(input: { uri: string; name: string; mimeType?: string | null }) {
    const fileType = inferFileType(input.name, input.mimeType)
    const importService = new DocumentImportService({
      store: new ImportedDocumentStore(),
      repository: this.indexRepository
    })
    const imported = await importService.importDocument({
      uri: input.uri,
      name: input.name,
      fileType
    })

    const embeddingTarget = await this.selectionService.resolveEmbeddingTarget()
    const indexingService = new DocumentIndexingService({
      repository: {
        loadDocumentForIndexing: async (documentId: string) => {
          const loaded = await this.indexRepository.loadDocumentForIndexingRecord(documentId)

          return {
            document: {
              id: loaded.document.id,
              embeddingModelId: embeddingTarget.modelId,
              embeddingProviderId: embeddingTarget.providerProfileId
            },
            text: {
              normalizedText: loaded.text.normalizedText,
              outlineJson: loaded.text.outlineJson,
              pageMapJson: loaded.text.pageMapJson
            },
            job: { id: loaded.job.id }
          }
        },
        replaceDocumentChunks: (documentId, chunks) => this.indexRepository.replaceDocumentChunks(documentId, chunks),
        updateIndexJob: (jobId, patch) => this.indexRepository.updateIndexJob(jobId, patch),
        updateDocument: (documentId, patch) => this.indexRepository.updateDocument(documentId, patch)
      },
      embeddingGateway: this.providerRuntimeService
    })

    await indexingService.indexDocument(imported.id)

    return imported
  }

  async getDocumentDetail(documentId: string) {
    return this.indexRepository.findDocumentDetail(documentId)
  }
}
