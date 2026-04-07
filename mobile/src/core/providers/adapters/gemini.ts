import type {
  AdapterModelDescriptor,
  ProviderAdapter,
  ProviderProfileRecord
} from '../types'

function trimTrailingSlash(value: string) {
  return value.endsWith('/') ? value.slice(0, -1) : value
}

type GeminiModelsResponse = {
  models: Array<{ name: string; displayName?: string }>
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
}
