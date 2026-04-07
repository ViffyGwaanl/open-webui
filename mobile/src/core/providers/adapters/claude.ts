import type {
  AdapterModelDescriptor,
  ProviderAdapter,
  ProviderEmbeddingRequest,
  ProviderProfileRecord,
  ProviderTextRequest
} from '../types'

const CLAUDE_MODELS: AdapterModelDescriptor[] = [
  {
    modelId: 'claude-3-7-sonnet-latest',
    label: 'claude-3-7-sonnet-latest',
    supportsStreaming: true,
    supportsReasoning: true,
    isEmbeddingModel: false
  },
  {
    modelId: 'claude-3-5-haiku-latest',
    label: 'claude-3-5-haiku-latest',
    supportsStreaming: true,
    supportsReasoning: false,
    isEmbeddingModel: false
  }
]

type ClaudeMessagesResponse = {
  content?: Array<{ type?: string; text?: string }>
  usage?: {
    input_tokens?: number
    output_tokens?: number
  }
}

function trimTrailingSlash(value: string) {
  return value.endsWith('/') ? value.slice(0, -1) : value
}

export class ClaudeAdapter implements ProviderAdapter {
  async listModels() {
    return CLAUDE_MODELS
  }

  async streamText(
    profile: ProviderProfileRecord,
    apiKey: string,
    request: ProviderTextRequest,
    sink: (event: {
      type: 'response_started'
    } | {
      type: 'text_delta'
      text: string
    } | {
      type: 'response_completed'
      usage: { inputTokens: number; outputTokens: number }
    }) => Promise<void> | void
  ) {
    const response = await fetch(`${trimTrailingSlash(profile.baseUrl)}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: request.modelId,
        max_tokens: 4096,
        messages: [{ role: 'user', content: request.prompt }]
      })
    })

    if (!response.ok) {
      throw new Error(`Claude completion failed with status ${response.status}`)
    }

    const payload = (await response.json()) as ClaudeMessagesResponse
    const text = (payload.content ?? [])
      .filter((block) => block.type === 'text' && typeof block.text === 'string')
      .map((block) => block.text as string)
      .join('')

    await sink({ type: 'response_started' })

    if (text) {
      await sink({ type: 'text_delta', text })
    }

    await sink({
      type: 'response_completed',
      usage: {
        inputTokens: payload.usage?.input_tokens ?? 0,
        outputTokens: payload.usage?.output_tokens ?? 0
      }
    })
  }

  async embedTexts(
    _profile: ProviderProfileRecord,
    _apiKey: string,
    _request: ProviderEmbeddingRequest
  ): Promise<number[][]> {
    throw new Error('Claude adapter does not support embeddings')
  }
}
