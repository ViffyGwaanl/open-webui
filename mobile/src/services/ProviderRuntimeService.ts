import type { StreamSink } from '../core/chat/streamEvents'
import { ProviderRegistry } from '../core/providers/registry'
import type {
  AdapterModelDescriptor,
  ProviderEmbeddingRequest,
  ProviderPreset,
  ProviderTextRequest
} from '../core/providers/types'
import { ApiKeyStore } from '../storage/secure/apiKeys'

type StoredProviderProfileRecord = {
  id: string
  presetType: string
  displayName: string
  baseUrl: string
  apiKeyRef: string
  extraHeadersJson: string
  enabled: boolean
}

type ProviderProfileRepositoryLike = {
  findById: (id: string) => Promise<StoredProviderProfileRecord | null>
}

type ProviderRegistryLike = {
  resolve: (presetType: ProviderPreset) => {
    listModels: (profile: StoredProviderProfileRecord, apiKey: string) => Promise<AdapterModelDescriptor[]>
    streamText: (
      profile: StoredProviderProfileRecord,
      apiKey: string,
      request: ProviderTextRequest,
      sink: StreamSink
    ) => Promise<void>
    embedTexts: (
      profile: StoredProviderProfileRecord,
      apiKey: string,
      request: ProviderEmbeddingRequest
    ) => Promise<number[][]>
  }
}

type ProviderApiKeyStoreLike = {
  getApiKey: (ref: string) => Promise<string | null>
}

type ProviderRuntimeServiceDeps = {
  profileRepository?: ProviderProfileRepositoryLike
  apiKeyStore?: ProviderApiKeyStoreLike
  registry?: ProviderRegistryLike
}

function createDefaultProfileRepository(): ProviderProfileRepositoryLike {
  const { ProviderProfileRepository } = require('../storage/db/repositories/ProviderProfileRepository') as typeof import('../storage/db/repositories/ProviderProfileRepository')
  return new ProviderProfileRepository()
}

function normalizePreset(value: string): ProviderPreset {
  if (value === 'openai' || value === 'gemini' || value === 'claude') {
    return value
  }

  throw new Error(`Unsupported provider preset ${value}`)
}

async function loadRequiredApiKey(apiKeyStore: ProviderApiKeyStoreLike, ref: string) {
  const apiKey = await apiKeyStore.getApiKey(ref)

  if (!apiKey) {
    throw new Error(`API key not found for ${ref}`)
  }

  return apiKey
}

export class ProviderRuntimeService {
  private readonly profileRepository: ProviderProfileRepositoryLike
  private readonly apiKeyStore: ProviderApiKeyStoreLike
  private readonly registry: ProviderRegistryLike

  constructor({
    profileRepository = createDefaultProfileRepository(),
    apiKeyStore = new ApiKeyStore(),
    registry = new ProviderRegistry() as ProviderRegistryLike
  }: ProviderRuntimeServiceDeps = {}) {
    this.profileRepository = profileRepository
    this.apiKeyStore = apiKeyStore
    this.registry = registry
  }

  async listModels(providerProfileId: string) {
    const { profile, apiKey, adapter } = await this.resolveRuntime(providerProfileId)
    return adapter.listModels(profile, apiKey)
  }

  async streamText(request: ProviderTextRequest & { providerProfileId: string }, sink: StreamSink) {
    const { profile, apiKey, adapter } = await this.resolveRuntime(request.providerProfileId)

    await adapter.streamText(
      profile,
      apiKey,
      {
        modelId: request.modelId,
        prompt: request.prompt
      },
      sink
    )
  }

  async generateText(request: ProviderTextRequest & { providerProfileId: string }) {
    let text = ''

    await this.streamText(request, async (event) => {
      if (event.type === 'text_delta') {
        text += event.text
      }

      if (event.type === 'response_failed') {
        throw new Error(event.message)
      }
    })

    return text
  }

  async embedTexts(request: ProviderEmbeddingRequest & { providerProfileId: string }) {
    const { profile, apiKey, adapter } = await this.resolveRuntime(request.providerProfileId)

    return adapter.embedTexts(profile, apiKey, {
      modelId: request.modelId,
      texts: request.texts
    })
  }

  private async resolveRuntime(providerProfileId: string) {
    const profile = await this.profileRepository.findById(providerProfileId)

    if (!profile) {
      throw new Error(`Provider profile ${providerProfileId} not found`)
    }

    const apiKey = await loadRequiredApiKey(this.apiKeyStore, profile.apiKeyRef)
    const adapter = this.registry.resolve(normalizePreset(profile.presetType))

    return {
      profile,
      apiKey,
      adapter
    }
  }
}
