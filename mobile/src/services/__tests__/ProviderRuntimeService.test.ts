import { describe, expect, it, jest } from '@jest/globals'

import type { CanonicalStreamEvent } from '../../core/chat/types'
import { ProviderRuntimeService } from '../ProviderRuntimeService'

describe('ProviderRuntimeService', () => {
  it('loads the saved provider profile and api key before streaming text', async () => {
    const profileRepository = {
      findById: jest.fn(async () => ({
        id: 'openai-main',
        presetType: 'openai',
        displayName: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
        apiKeyRef: 'provider:openai-main',
        extraHeadersJson: '{}',
        enabled: true
      }))
    }
    const apiKeyStore = {
      getApiKey: jest.fn(async () => 'sk-test')
    }
    const adapter = {
      listModels: jest.fn(),
      streamText: jest.fn(
        async (
          _profile,
          _apiKey,
          _request,
          sink: (event: CanonicalStreamEvent) => void | Promise<void>
        ) => {
        await sink({ type: 'response_started' })
        await sink({ type: 'text_delta', text: 'runtime answer' })
        await sink({ type: 'response_completed', usage: { inputTokens: 7, outputTokens: 3 } })
        }
      ),
      embedTexts: jest.fn(async () => [[0.1, 0.2]])
    }
    const registry = {
      resolve: jest.fn(() => adapter)
    }
    const service = new ProviderRuntimeService({
      profileRepository: profileRepository as never,
      apiKeyStore: apiKeyStore as never,
      registry: registry as never
    })
    const events: Array<Record<string, unknown>> = []

    await service.streamText(
      {
        providerProfileId: 'openai-main',
        modelId: 'gpt-4.1-mini',
        prompt: 'Hello'
      },
      (event: CanonicalStreamEvent) => {
        events.push(event as never)
      }
    )

    expect(profileRepository.findById).toHaveBeenCalledWith('openai-main')
    expect(apiKeyStore.getApiKey).toHaveBeenCalledWith('provider:openai-main')
    expect(adapter.streamText).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'openai-main' }),
      'sk-test',
      expect.objectContaining({ modelId: 'gpt-4.1-mini', prompt: 'Hello' }),
      expect.any(Function)
    )
    expect(events).toEqual([
      { type: 'response_started' },
      { type: 'text_delta', text: 'runtime answer' },
      { type: 'response_completed', usage: { inputTokens: 7, outputTokens: 3 } }
    ])
  })

  it('delegates embedding requests through the resolved adapter', async () => {
    const adapter = {
      listModels: jest.fn(),
      streamText: jest.fn(),
      embedTexts: jest.fn(async () => [[0.3, 0.4]])
    }
    const service = new ProviderRuntimeService({
      profileRepository: {
        findById: async () => ({
          id: 'gemini-main',
          presetType: 'gemini',
          displayName: 'Gemini',
          baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
          apiKeyRef: 'provider:gemini-main',
          extraHeadersJson: '{}',
          enabled: true
        })
      } as never,
      apiKeyStore: {
        getApiKey: async () => 'gem-key'
      } as never,
      registry: {
        resolve: () => adapter as never
      } as never
    })

    await expect(
      service.embedTexts({
        providerProfileId: 'gemini-main',
        modelId: 'text-embedding-004',
        texts: ['hello']
      })
    ).resolves.toEqual([[0.3, 0.4]])
  })
})
