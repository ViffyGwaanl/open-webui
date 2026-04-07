import type { RetrievalContext } from '../core/rag/types'

type TurnEvidenceRepository = {
  insertContext: (record: {
    id: string
    turnId: string
    retrievalMode: string
    queryText: string
    createdAt: number
    updatedAt: number
  }) => Promise<void>
  insertItems: (
    retrievalContextId: string,
    items: Array<{
      id: string
      retrievalContextId: string
      documentId: string
      sourceLabel: string
      snippetText: string
      pageNumber: number | null
      sectionTitle: string | null
      rank: number
      included: boolean
      createdAt: number
      updatedAt: number
    }>
  ) => Promise<void>
}

type TurnEvidenceServiceDeps = {
  repository: TurnEvidenceRepository
  createId?: () => string
  now?: () => number
}

function createRandomId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export class TurnEvidenceService {
  private readonly repository: TurnEvidenceRepository
  private readonly createId: () => string
  private readonly now: () => number

  constructor({ repository, createId = createRandomId, now = () => Date.now() }: TurnEvidenceServiceDeps) {
    this.repository = repository
    this.createId = createId
    this.now = now
  }

  async saveSnapshot(turnId: string, snapshot: RetrievalContext & { queryText?: string }) {
    const createdAt = this.now()
    const retrievalContextId = this.createId()

    await this.repository.insertContext({
      id: retrievalContextId,
      turnId,
      retrievalMode: 'rag',
      queryText: snapshot.queryText ?? '',
      createdAt,
      updatedAt: createdAt
    })
    await this.repository.insertItems(
      retrievalContextId,
      snapshot.snippets.map((snippet, index) => ({
        id: this.createId(),
        retrievalContextId,
        documentId: snippet.documentId,
        sourceLabel: snippet.sourceLabel,
        snippetText: snippet.snippetText,
        pageNumber: snippet.pageNumber,
        sectionTitle: snippet.sectionTitle,
        rank: index,
        included: true,
        createdAt,
        updatedAt: createdAt
      }))
    )
  }
}
