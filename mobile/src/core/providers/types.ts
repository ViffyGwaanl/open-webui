import type { StreamSink } from '../chat/streamEvents'

export type ProviderPreset = 'openai' | 'gemini' | 'claude' | 'review-demo'

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

export type ProviderTextRequest = {
  modelId: string
  prompt: string
}

export type ProviderEmbeddingRequest = {
  modelId: string
  texts: string[]
}

export interface ProviderAdapter {
  listModels(profile: ProviderProfileRecord, apiKey: string): Promise<AdapterModelDescriptor[]>
  streamText(
    profile: ProviderProfileRecord,
    apiKey: string,
    request: ProviderTextRequest,
    sink: StreamSink
  ): Promise<void>
  embedTexts(
    profile: ProviderProfileRecord,
    apiKey: string,
    request: ProviderEmbeddingRequest
  ): Promise<number[][]>
}
