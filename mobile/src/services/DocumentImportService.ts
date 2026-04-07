import { extractDocumentText } from '../core/rag/import/extractText'
import { extractTextFromFile } from '../core/rag/import/extractTextFromFile'
import type { ExtractedDocumentText, SupportedRagFileType } from '../core/rag/types'

type ImportDocumentInput = {
  uri: string
  name: string
  fileType: SupportedRagFileType
}

type ManagedStoredDocument = {
  storageUri: string
  checksum: string
  fileSize: number | null
}

type DocumentImportRepository = {
  insertDocument: (record: {
    id: string
    displayName: string
    fileType: SupportedRagFileType
    storageUri: string
    checksum: string
    fileSize: number | null
    pageCount: number | null
    textLength: number
    importStatus: string
    indexStatus: string
    createdAt: number
    updatedAt: number
  }) => Promise<void>
  insertDocumentText: (record: {
    id: string
    documentId: string
    normalizedText: string
    outlineJson: string
    pageMapJson: string
    createdAt: number
    updatedAt: number
  }) => Promise<void>
  insertIndexJob: (record: {
    id: string
    documentId: string
    status: string
    attemptCount: number
    lastErrorJson: string
    lastProgressAt: number | null
    createdAt: number
    updatedAt: number
  }) => Promise<void>
}

type DocumentImportStore = {
  copyIntoManagedStorage: (input: ImportDocumentInput) => Promise<ManagedStoredDocument>
}

type ExtractTextDependency = (input: ImportDocumentInput) => Promise<ExtractedDocumentText>

type DocumentImportServiceDeps = {
  store: DocumentImportStore
  repository: DocumentImportRepository
  createId?: () => string
  now?: () => number
  extractText?: ExtractTextDependency
}

function createRandomId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export class DocumentImportService {
  private readonly store: DocumentImportStore
  private readonly repository: DocumentImportRepository
  private readonly createId: () => string
  private readonly now: () => number
  private readonly extractText: ExtractTextDependency

  constructor({
    store,
    repository,
    createId = createRandomId,
    now = () => Date.now(),
    extractText: extractTextDependency = extractTextFromFile
  }: DocumentImportServiceDeps) {
    this.store = store
    this.repository = repository
    this.createId = createId
    this.now = now
    this.extractText = extractTextDependency
  }

  async importDocument(input: ImportDocumentInput) {
    const createdAt = this.now()
    const documentId = this.createId()
    const documentTextId = this.createId()
    const indexJobId = this.createId()
    const storedFile = await this.store.copyIntoManagedStorage(input)
    const extracted = await this.extractText(input)

    await this.repository.insertDocument({
      id: documentId,
      displayName: input.name,
      fileType: input.fileType,
      storageUri: storedFile.storageUri,
      checksum: storedFile.checksum,
      fileSize: storedFile.fileSize,
      pageCount: extracted.pageCount,
      textLength: extracted.textLength,
      importStatus: 'imported',
      indexStatus: 'pending',
      createdAt,
      updatedAt: createdAt
    })
    await this.repository.insertDocumentText({
      id: documentTextId,
      documentId,
      normalizedText: extracted.plainText,
      outlineJson: JSON.stringify(extracted.outline),
      pageMapJson: JSON.stringify(extracted.pages),
      createdAt,
      updatedAt: createdAt
    })
    await this.repository.insertIndexJob({
      id: indexJobId,
      documentId,
      status: 'pending',
      attemptCount: 0,
      lastErrorJson: '{}',
      lastProgressAt: null,
      createdAt,
      updatedAt: createdAt
    })

    return {
      id: documentId,
      fileType: input.fileType
    }
  }
}
