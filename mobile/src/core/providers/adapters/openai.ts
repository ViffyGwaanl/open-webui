import type {
  AdapterModelDescriptor,
  ProviderEmbeddingRequest,
  ProviderAdapter,
  ProviderTextRequest,
  ProviderProfileRecord
} from '../types'

function trimTrailingSlash(value: string) {
  return value.endsWith('/') ? value.slice(0, -1) : value
}

type OpenAIModelsResponse = {
  data: Array<{ id: string }>
}

type OpenAIChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>
    }
  }>
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
  }
}

type OpenAIMessageContent = string | Array<{ type?: string; text?: string }> | undefined

type OpenAIEmbeddingsResponse = {
  data?: Array<{
    embedding?: number[]
  }>
}

function extractTextContent(content: OpenAIMessageContent) {
  if (typeof content === 'string') {
    return content
  }

  if (Array.isArray(content)) {
    return content
      .map((block) => (typeof block.text === 'string' ? block.text : ''))
      .filter(Boolean)
      .join('')
  }

  return ''
}

export class OpenAIAdapter implements ProviderAdapter {
  async listModels(
    profile: ProviderProfileRecord,
    apiKey: string
  ): Promise<AdapterModelDescriptor[]> {
    const response = await fetch(`${trimTrailingSlash(profile.baseUrl)}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` }
    })

    if (!response.ok) {
      throw new Error(`OpenAI model discovery failed with status ${response.status}`)
    }

    const payload = (await response.json()) as OpenAIModelsResponse

    return payload.data.map((item) => ({
      modelId: item.id,
      label: item.id,
      supportsStreaming: true,
      supportsReasoning: false,
      isEmbeddingModel: item.id.includes('embedding')
    }))
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
    const response = await fetch(`${trimTrailingSlash(profile.baseUrl)}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: request.modelId,
        messages: [{ role: 'user', content: request.prompt }]
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI completion failed with status ${response.status}`)
    }

    const payload = (await response.json()) as OpenAIChatCompletionResponse
    const content = extractTextContent(payload.choices?.[0]?.message?.content)

    await sink({ type: 'response_started' })

    if (content) {
      await sink({ type: 'text_delta', text: content })
    }

    await sink({
      type: 'response_completed',
      usage: {
        inputTokens: payload.usage?.prompt_tokens ?? 0,
        outputTokens: payload.usage?.completion_tokens ?? 0
      }
    })
  }

  async embedTexts(
    profile: ProviderProfileRecord,
    apiKey: string,
    request: ProviderEmbeddingRequest
  ): Promise<number[][]> {
    const response = await fetch(`${trimTrailingSlash(profile.baseUrl)}/embeddings`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: request.modelId,
        input: request.texts
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI embeddings failed with status ${response.status}`)
    }

    const payload = (await response.json()) as OpenAIEmbeddingsResponse
    return (payload.data ?? []).map((item) => item.embedding ?? [])
  }
}
