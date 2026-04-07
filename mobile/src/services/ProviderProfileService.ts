import type { ProviderProfileInput } from '../core/providers/types'
import { ApiKeyStore } from '../storage/secure/apiKeys'

type ProviderProfileRepository = {
  upsert: (record: {
    id: string
    presetType: string
    displayName: string
    baseUrl: string
    apiKeyRef: string
    createdAt: number
    updatedAt: number
    extraHeadersJson?: string
    enabled?: boolean
  }) => Promise<void>
}

type ProviderApiKeyStore = {
  setApiKey: (ref: string, apiKey: string) => Promise<void>
}

function createDefaultProviderProfileRepository(): ProviderProfileRepository {
  const { ProviderProfileRepository } = require('../storage/db/repositories/ProviderProfileRepository') as typeof import('../storage/db/repositories/ProviderProfileRepository')
  return new ProviderProfileRepository()
}

export class ProviderProfileService {
  constructor(
    private readonly repository: ProviderProfileRepository = createDefaultProviderProfileRepository(),
    private readonly apiKeyStore: ProviderApiKeyStore = new ApiKeyStore()
  ) {}

  async save(input: ProviderProfileInput) {
    const apiKeyRef = `provider:${input.id}`
    const now = Date.now()

    if (input.apiKey) {
      await this.apiKeyStore.setApiKey(apiKeyRef, input.apiKey)
    }

    await this.repository.upsert({
      id: input.id,
      presetType: input.presetType,
      displayName: input.displayName,
      baseUrl: input.baseUrl,
      apiKeyRef,
      createdAt: now,
      updatedAt: now,
      extraHeadersJson: '{}',
      enabled: true
    })
  }
}
