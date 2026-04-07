import type { ProviderProfileInput } from '../core/providers/types'

type ProviderProfileRepository = {
  upsert: (record: {
    id: string
    presetType: string
    displayName: string
    baseUrl: string
    apiKeyRef: string
  }) => Promise<void>
}

type ProviderApiKeyStore = {
  setApiKey: (ref: string, apiKey: string) => Promise<void>
}

export class ProviderProfileService {
  constructor(
    private readonly repository: ProviderProfileRepository,
    private readonly apiKeyStore: ProviderApiKeyStore
  ) {}

  async save(input: ProviderProfileInput) {
    const apiKeyRef = `provider:${input.id}`

    if (input.apiKey) {
      await this.apiKeyStore.setApiKey(apiKeyRef, input.apiKey)
    }

    await this.repository.upsert({
      id: input.id,
      presetType: input.presetType,
      displayName: input.displayName,
      baseUrl: input.baseUrl,
      apiKeyRef
    })
  }
}
