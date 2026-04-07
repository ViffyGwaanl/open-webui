import type {
  AdapterModelDescriptor,
  ProviderAdapter,
  ProviderProfileRecord
} from '../types'

function trimTrailingSlash(value: string) {
  return value.endsWith('/') ? value.slice(0, -1) : value
}

type OpenAIModelsResponse = {
  data: Array<{ id: string }>
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
}
