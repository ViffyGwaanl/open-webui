import { retrieveContext } from '../core/rag/retrieval/retrieveContext'
import type { RetrievalCandidate, RetrievalContext } from '../core/rag/types'

type RetrievalRepository = {
  searchKeywordCandidates: (query: string) => Promise<RetrievalCandidate[]>
}

type EmbeddingGateway = {
  embedTexts: (args: {
    providerProfileId: string
    modelId: string
    texts: string[]
  }) => Promise<number[][]>
}

type RetrievalServiceDeps = {
  repository: RetrievalRepository
  embeddingGateway: EmbeddingGateway
  embeddingProviderProfileId: string
  embeddingModelId: string
}

export class RetrievalService {
  constructor(private readonly deps: RetrievalServiceDeps) {}

  async retrieve(query: string, topK = 4): Promise<RetrievalContext> {
    const candidates = await this.deps.repository.searchKeywordCandidates(query)
    const [queryEmbedding] = await this.deps.embeddingGateway.embedTexts({
      providerProfileId: this.deps.embeddingProviderProfileId,
      modelId: this.deps.embeddingModelId,
      texts: [query]
    })

    return retrieveContext({
      topK,
      queryEmbedding: queryEmbedding ?? [],
      candidates
    })
  }
}
