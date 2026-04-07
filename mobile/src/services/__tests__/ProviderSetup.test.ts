import { describe, expect, it, jest } from '@jest/globals'

import { ModelCatalogService } from '../ModelCatalogService'
import { ProviderProfileService } from '../ProviderProfileService'

describe('ProviderProfileService', () => {
  it('stores provider metadata separately from the API key', async () => {
    const secureStore = { setApiKey: jest.fn() }
    const repository = { upsert: jest.fn() }
    const service = new ProviderProfileService(repository as any, secureStore as any)

    await service.save({
      id: 'openai-main',
      presetType: 'openai',
      displayName: 'OpenAI Main',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: 'sk-test'
    })

    expect(repository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ apiKeyRef: 'provider:openai-main' })
    )
    expect(secureStore.setApiKey).toHaveBeenCalledWith('provider:openai-main', 'sk-test')
  })
})

describe('ModelCatalogService', () => {
  it('normalizes providers into one model descriptor shape', async () => {
    const listModels = jest.fn<
      (profile: unknown, apiKey: string) => Promise<
        Array<{
          modelId: string
          label: string
          supportsStreaming: boolean
          supportsReasoning: boolean
          isEmbeddingModel: boolean
        }>
      >
    >()
    listModels.mockResolvedValue([
      {
        modelId: 'gpt-4.1-mini',
        label: 'GPT-4.1 mini',
        supportsStreaming: true,
        supportsReasoning: false,
        isEmbeddingModel: false
      }
    ])

    const registry = {
      resolve: jest.fn().mockReturnValue({
        listModels
      })
    }
    const service = new ModelCatalogService(registry as any)

    const result = await service.list({
      id: 'openai-main',
      presetType: 'openai',
      displayName: 'OpenAI Main',
      baseUrl: 'https://api.openai.com/v1',
      apiKeyRef: 'provider:openai-main'
    })

    expect(result).toEqual([
      expect.objectContaining({
        providerProfileId: 'openai-main',
        modelId: 'gpt-4.1-mini',
        label: 'GPT-4.1 mini',
        supportsStreaming: true
      })
    ])
  })
})
