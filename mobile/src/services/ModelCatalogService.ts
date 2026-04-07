import type {
  AdapterModelDescriptor,
  ModelDescriptor,
  ProviderPreset,
  ProviderProfileRecord
} from '../core/providers/types'

type ProviderRegistryLike = {
  resolve: (presetType: ProviderPreset) => {
    listModels: (
      profile: ProviderProfileRecord,
      apiKey: string
    ) => Promise<AdapterModelDescriptor[]>
  }
}

export class ModelCatalogService {
  constructor(private readonly registry: ProviderRegistryLike) {}

  async list(profile: ProviderProfileRecord, apiKey = 'test-key'): Promise<ModelDescriptor[]> {
    const adapter = this.registry.resolve(profile.presetType)
    const models = await adapter.listModels(profile, apiKey)

    return models.map((model) => ({
      ...model,
      providerProfileId: profile.id
    }))
  }
}
