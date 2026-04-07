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

type GeminiModelsResponse = {
  models: Array<{ name: string; displayName?: string }>
}

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>
    }
  }>
  usageMetadata?: {
    promptTokenCount?: number
    candidatesTokenCount?: number
  }
}

type GeminiBatchEmbedResponse = {
  embeddings?: Array<{ values?: number[] }>
}

function encodeModelPath(modelId: string) {
  return encodeURIComponent(modelId)
}

function extractCandidateText(payload: GeminiGenerateContentResponse) {
  return (
    payload.candidates?.[0]?.content?.parts
      ?.map((part) => (typeof part.text === 'string' ? part.text : ''))
      .filter(Boolean)
      .join('') ?? ''
  )
}

export class GeminiAdapter implements ProviderAdapter {
  async listModels(
    profile: ProviderProfileRecord,
    apiKey: string
  ): Promise<AdapterModelDescriptor[]> {
    const url = new URL(`${trimTrailingSlash(profile.baseUrl)}/models`)
    url.searchParams.set('key', apiKey)

    const response = await fetch(url.toString())

    if (!response.ok) {
      throw new Error(`Gemini model discovery failed with status ${response.status}`)
    }

    const payload = (await response.json()) as GeminiModelsResponse

    return payload.models.map((item) => ({
      modelId: item.name.replace('models/', ''),
      label: item.displayName ?? item.name,
      supportsStreaming: true,
      supportsReasoning: false,
      isEmbeddingModel: item.name.includes('embedding')
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
    const url = new URL(
      `${trimTrailingSlash(profile.baseUrl)}/models/${encodeModelPath(request.modelId)}:generateContent`
    )
    url.searchParams.set('key', apiKey)

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: request.prompt }] }]
      })
    })

    if (!response.ok) {
      throw new Error(`Gemini completion failed with status ${response.status}`)
    }

    const payload = (await response.json()) as GeminiGenerateContentResponse
    const text = extractCandidateText(payload)

    await sink({ type: 'response_started' })

    if (text) {
      await sink({ type: 'text_delta', text })
    }

    await sink({
      type: 'response_completed',
      usage: {
        inputTokens: payload.usageMetadata?.promptTokenCount ?? 0,
        outputTokens: payload.usageMetadata?.candidatesTokenCount ?? 0
      }
    })
  }

  async embedTexts(
    profile: ProviderProfileRecord,
    apiKey: string,
    request: ProviderEmbeddingRequest
  ): Promise<number[][]> {
    const url = new URL(
      `${trimTrailingSlash(profile.baseUrl)}/models/${encodeModelPath(request.modelId)}:batchEmbedContents`
    )
    url.searchParams.set('key', apiKey)

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: request.texts.map((text) => ({
          content: {
            role: 'user',
            parts: [{ text }]
          }
        }))
      })
    })

    if (!response.ok) {
      throw new Error(`Gemini embeddings failed with status ${response.status}`)
    }

    const payload = (await response.json()) as GeminiBatchEmbedResponse
    return (payload.embeddings ?? []).map((item) => item.values ?? [])
  }
}
