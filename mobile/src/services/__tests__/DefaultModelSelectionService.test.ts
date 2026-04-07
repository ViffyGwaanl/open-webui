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
      comparePresetRepository: {
        findById: async () => null
      } as never,
      preferenceRepository: {
        getValue: async () => null
      } as never,
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
      comparePresetRepository: {
        findById: async () => null
      } as never,
      preferenceRepository: {
        getValue: async () => null
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
      presetId: null,
      sharedContextEnabled: false,
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

  it('uses the active compare preset when one is configured', async () => {
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
            id: 'gemini-main',
            presetType: 'gemini',
            displayName: 'Gemini',
            baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
            apiKeyRef: 'provider:gemini-main',
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
        listModels: async (providerProfileId: string) => {
          switch (providerProfileId) {
            case 'openai-main':
              return [
                {
                  modelId: 'gpt-4.1',
                  label: 'GPT-4.1',
                  supportsStreaming: true,
                  supportsReasoning: true,
                  isEmbeddingModel: false
                }
              ]
            case 'gemini-main':
              return [
                {
                  modelId: 'gemini-2.5-pro',
                  label: 'Gemini 2.5 Pro',
                  supportsStreaming: true,
                  supportsReasoning: true,
                  isEmbeddingModel: false
                }
              ]
            default:
              return [
                {
                  modelId: 'claude-3-7-sonnet-latest',
                  label: 'Claude 3.7 Sonnet',
                  supportsStreaming: true,
                  supportsReasoning: true,
                  isEmbeddingModel: false
                }
              ]
          }
        }
      } as never,
      comparePresetRepository: {
        findById: async (presetId: string) =>
          presetId === 'preset-triad'
            ? {
                id: 'preset-triad',
                name: 'Triad',
                targetModelsJson: JSON.stringify([
                  { providerProfileId: 'gemini-main', modelId: 'gemini-2.5-pro' },
                  { providerProfileId: 'claude-main', modelId: 'claude-3-7-sonnet-latest' },
                  { providerProfileId: 'openai-main', modelId: 'gpt-4.1' }
                ]),
                judgeConfigJson: JSON.stringify({
                  judgeProviderProfileId: 'openai-main',
                  judgeModelId: 'gpt-4.1'
                }),
                sharedContextEnabled: false,
                advancedParamsJson: '{}',
                createdAt: 10,
                updatedAt: 10
              }
            : null
      } as never,
      preferenceRepository: {
        getValue: async (key: string) =>
          key === 'active_compare_preset_id' ? JSON.stringify('preset-triad') : null
      } as never
    })

    await expect(service.resolveCompareTargets()).resolves.toEqual({
      presetId: 'preset-triad',
      sharedContextEnabled: false,
      branches: [
        {
          providerProfileId: 'gemini-main',
          providerLabel: 'Gemini',
          modelId: 'gemini-2.5-pro',
          modelLabel: 'Gemini 2.5 Pro'
        },
        {
          providerProfileId: 'claude-main',
          providerLabel: 'Claude',
          modelId: 'claude-3-7-sonnet-latest',
          modelLabel: 'Claude 3.7 Sonnet'
        },
        {
          providerProfileId: 'openai-main',
          providerLabel: 'OpenAI',
          modelId: 'gpt-4.1',
          modelLabel: 'GPT-4.1'
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

  it('preserves a compare preset with no judge instead of forcing the first branch', async () => {
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
      } as never,
      comparePresetRepository: {
        findById: async () => ({
          id: 'preset-no-judge',
          name: 'No Judge',
          targetModelsJson: JSON.stringify([
            { providerProfileId: 'openai-main', modelId: 'gpt-4.1' },
            { providerProfileId: 'claude-main', modelId: 'claude-3-7-sonnet-latest' }
          ]),
          judgeConfigJson: JSON.stringify({
            judgeProviderProfileId: null,
            judgeModelId: null
          }),
          sharedContextEnabled: false,
          advancedParamsJson: '{}',
          createdAt: 10,
          updatedAt: 10
        })
      } as never,
      preferenceRepository: {
        getValue: async () => JSON.stringify('preset-no-judge')
      } as never
    })

    await expect(service.resolveCompareTargets()).resolves.toEqual({
      presetId: 'preset-no-judge',
      sharedContextEnabled: false,
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
      judge: null
    })
  })
})
