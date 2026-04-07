import type { StreamSink } from '../../chat/streamEvents'
import type {
  AdapterModelDescriptor,
  ProviderAdapter,
  ProviderEmbeddingRequest,
  ProviderProfileRecord,
  ProviderTextRequest
} from '../types'

const REVIEW_MODELS: AdapterModelDescriptor[] = [
  {
    modelId: 'review-demo-balanced',
    label: 'Review Demo Balanced',
    supportsStreaming: true,
    supportsReasoning: false,
    isEmbeddingModel: false
  },
  {
    modelId: 'review-demo-critic',
    label: 'Review Demo Critic',
    supportsStreaming: true,
    supportsReasoning: true,
    isEmbeddingModel: false
  },
  {
    modelId: 'review-demo-creative',
    label: 'Review Demo Creative',
    supportsStreaming: true,
    supportsReasoning: false,
    isEmbeddingModel: false
  },
  {
    modelId: 'review-demo-embedding',
    label: 'Review Demo Embedding',
    supportsStreaming: false,
    supportsReasoning: false,
    isEmbeddingModel: true
  }
]

function buildDemoAnswer(modelId: string, prompt: string) {
  switch (modelId) {
    case 'review-demo-critic':
      return `Review Demo Critic\n\nMain tradeoffs:\n- Strengths: ${prompt.slice(0, 48) || 'clear request'}\n- Risks: local persistence, model fallbacks, release recovery.\n- Recommendation: prefer deterministic local state and vendor-agnostic prompts.`
    case 'review-demo-creative':
      return `Review Demo Creative\n\nA polished mobile AI workspace should feel local-first, fast to resume, and explicit about evidence. For "${prompt}", I would contrast multiple models, show where they differ, and keep the best branch easy to continue.`
    default:
      return `Review Demo Balanced\n\nSummary for "${prompt}": keep the product local-first, persist compare artifacts, and make RAG evidence reviewable before users continue a branch or export results.`
  }
}

function createEmbedding(text: string) {
  const seed = Array.from(text).reduce((total, character, index) => total + character.charCodeAt(0) * (index + 1), 0)
  return Array.from({ length: 8 }, (_, index) => Number((((seed % 997) + (index + 1) * 37) / 1000).toFixed(4)))
}

export class ReviewDemoAdapter implements ProviderAdapter {
  async listModels(_profile: ProviderProfileRecord, _apiKey: string): Promise<AdapterModelDescriptor[]> {
    return REVIEW_MODELS
  }

  async streamText(
    _profile: ProviderProfileRecord,
    _apiKey: string,
    request: ProviderTextRequest,
    sink: StreamSink
  ): Promise<void> {
    const answer = buildDemoAnswer(request.modelId, request.prompt)
    const midpoint = Math.ceil(answer.length / 2)

    await sink({ type: 'response_started' })
    await sink({ type: 'text_delta', text: answer.slice(0, midpoint) })
    await sink({ type: 'text_delta', text: answer.slice(midpoint) })
    await sink({
      type: 'response_completed',
      usage: {
        inputTokens: Math.ceil(request.prompt.length / 4),
        outputTokens: Math.ceil(answer.length / 4)
      }
    })
  }

  async embedTexts(
    _profile: ProviderProfileRecord,
    _apiKey: string,
    request: ProviderEmbeddingRequest
  ): Promise<number[][]> {
    return request.texts.map((text) => createEmbedding(`${request.modelId}:${text}`))
  }
}
