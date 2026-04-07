import type { RetrievalCandidate, RetrievalContext } from '../types'

import { applyMaxMarginalRelevance, cosineSimilarity } from './mmr'

type RetrieveContextArgs = {
  topK: number
  queryEmbedding: number[]
  candidates: RetrievalCandidate[]
}

export function retrieveContext({
  topK,
  queryEmbedding,
  candidates
}: RetrieveContextArgs): RetrievalContext {
  const ranked = candidates
    .map((candidate) => ({
      ...candidate,
      relevanceScore: candidate.keywordScore * 0.35 + cosineSimilarity(candidate.embedding, queryEmbedding) * 0.65
    }))
    .sort((left, right) => right.relevanceScore - left.relevanceScore)
  const selected = applyMaxMarginalRelevance(ranked, topK)

  return {
    snippets: selected.map((candidate) => ({
      id: candidate.id,
      documentId: candidate.documentId,
      sourceLabel: candidate.sourceLabel,
      snippetText: candidate.snippetText,
      sectionTitle: candidate.sectionTitle,
      pageNumber: candidate.pageNumber
    }))
  }
}
