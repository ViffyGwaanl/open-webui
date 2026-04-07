export type ProviderPreset = 'openai' | 'gemini' | 'claude'

export type ProviderProfileInput = {
  id: string
  presetType: ProviderPreset
  displayName: string
  baseUrl: string
  apiKey?: string
}

export type ProviderProfileRecord = {
  id: string
  presetType: ProviderPreset
  displayName: string
  baseUrl: string
  apiKeyRef: string
}

export type ModelDescriptor = {
  providerProfileId: string
  modelId: string
  label: string
  supportsStreaming: boolean
  supportsReasoning: boolean
  isEmbeddingModel: boolean
}

export type AdapterModelDescriptor = Omit<ModelDescriptor, 'providerProfileId'>

export interface ProviderAdapter {
  listModels(profile: ProviderProfileRecord, apiKey: string): Promise<AdapterModelDescriptor[]>
}
