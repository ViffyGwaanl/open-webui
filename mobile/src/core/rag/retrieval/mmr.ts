type RankedCandidate = {
  id: string
  relevanceScore: number
  embedding: number[]
}

function cosineSimilarity(left: number[], right: number[]) {
  const dot = left.reduce((sum, value, index) => sum + value * (right[index] ?? 0), 0)
  const leftMagnitude = Math.sqrt(left.reduce((sum, value) => sum + value * value, 0))
  const rightMagnitude = Math.sqrt(right.reduce((sum, value) => sum + value * value, 0))

  if (leftMagnitude === 0 || rightMagnitude === 0) {
    return 0
  }

  return dot / (leftMagnitude * rightMagnitude)
}

export function applyMaxMarginalRelevance<T extends RankedCandidate>(
  candidates: T[],
  topK: number,
  lambda = 0.5
) {
  const remaining = [...candidates]
  const selected: T[] = []

  while (remaining.length > 0 && selected.length < topK) {
    let bestIndex = 0
    let bestScore = Number.NEGATIVE_INFINITY

    remaining.forEach((candidate, index) => {
      const diversityPenalty =
        selected.length === 0
          ? 0
          : Math.max(...selected.map((chosen) => cosineSimilarity(candidate.embedding, chosen.embedding)))
      const score = lambda * candidate.relevanceScore - (1 - lambda) * diversityPenalty

      if (score > bestScore) {
        bestScore = score
        bestIndex = index
      }
    })

    selected.push(remaining.splice(bestIndex, 1)[0]!)
  }

  return selected
}

export { cosineSimilarity }
