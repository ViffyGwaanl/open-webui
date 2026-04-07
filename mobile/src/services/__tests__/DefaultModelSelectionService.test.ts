import { describe, expect, it, jest } from '@jest/globals'

import { DefaultModelSelectionService } from '../DefaultModelSelectionService'

describe('DefaultModelSelectionService', () => {
  it('picks the first chat-capable model for single turns and the first embedding model for RAG', async () => {
    const profilesRepository = {
      listAll: jest.fn(async () => [
        {
          id: 'openai-main',
          presetType: 'openai',
          displayName: 'OpenAI',
          baseUrl: 'https://api.openai.com/v1',
          apiKeyRef: 'provider:openai-main',
          extraHeadersJson: '{}',
          enabled: true
        }
      ])
    }
    const runtime = {
      listModels: jest.fn(async () => [
        {
          modelId: 'gpt-4.1-mini',
          label: 'GPT-4.1 mini',
          supportsStreaming: true,
          supportsReasoning: false,
          isEmbeddingModel: false
        },
        {
          modelId: 'text-embedding-3-small',
          label: 'text-embedding-3-small',
          supportsStreaming: false,
          supportsReasoning: false,
          isEmbeddingModel: true
        }
      ])
    }
    const service = new DefaultModelSelectionService({
      profilesRepository: profilesRepository as never,
      providerRuntimeService: runtime as never
    })

    await expect(service.resolveSingleChatTarget()).resolves.toEqual({
      providerProfileId: 'openai-main',
      providerLabel: 'OpenAI',
      modelId: 'gpt-4.1-mini',
      modelLabel: 'GPT-4.1 mini'
    })
    await expect(service.resolveEmbeddingTarget()).resolves.toEqual({
      providerProfileId: 'openai-main',
      providerLabel: 'OpenAI',
      modelId: 'text-embedding-3-small',
      modelLabel: 'text-embedding-3-small'
    })
  })

  it('selects the first two enabled provider chat models for compare and reuses the first as judge', async () => {
    const service = new DefaultModelSelectionService({
      profilesRepository: {
        listAll: async () => [
          {
            id: 'openai-main',
            presetType: 'openai',
            displayName: 'OpenAI',
            baseUrl: 'https://api.openai.com/v1',
            apiKeyRef: 'provider:openai-main',
            extraHeadersJson: '{}',
            enabled: true
          },
          {
            id: 'claude-main',
            presetType: 'claude',
            displayName: 'Claude',
            baseUrl: 'https://api.anthropic.com/v1',
            apiKeyRef: 'provider:claude-main',
            extraHeadersJson: '{}',
            enabled: true
          }
        ]
      } as never,
      providerRuntimeService: {
        listModels: async (providerProfileId: string) =>
          providerProfileId === 'openai-main'
            ? [
                {
                  modelId: 'gpt-4.1',
                  label: 'GPT-4.1',
                  supportsStreaming: true,
                  supportsReasoning: true,
                  isEmbeddingModel: false
                }
              ]
            : [
                {
                  modelId: 'claude-3-7-sonnet-latest',
                  label: 'Claude 3.7 Sonnet',
                  supportsStreaming: true,
                  supportsReasoning: true,
                  isEmbeddingModel: false
                }
              ]
      } as never
    })

    await expect(service.resolveCompareTargets()).resolves.toEqual({
      branches: [
        {
          providerProfileId: 'openai-main',
          providerLabel: 'OpenAI',
          modelId: 'gpt-4.1',
          modelLabel: 'GPT-4.1'
        },
        {
          providerProfileId: 'claude-main',
          providerLabel: 'Claude',
          modelId: 'claude-3-7-sonnet-latest',
          modelLabel: 'Claude 3.7 Sonnet'
        }
      ],
      judge: {
        providerProfileId: 'openai-main',
        providerLabel: 'OpenAI',
        modelId: 'gpt-4.1',
        modelLabel: 'GPT-4.1'
      }
    })
  })
})
