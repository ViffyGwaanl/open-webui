import { describe, expect, it, jest } from '@jest/globals'

import { ComparePresetService } from '../ComparePresetService'

describe('ComparePresetService', () => {
  it('stores compare preset defaults as snapshot JSON payloads', async () => {
    const repository = {
      upsert: jest.fn(),
      listAll: jest.fn(),
      findById: jest.fn()
    }
    const preferences = {
      getValue: jest.fn(),
      setValue: jest.fn()
    }
    const service = new ComparePresetService({
      repository: repository as never,
      preferenceRepository: preferences as never
    })

    await service.save({
      id: 'preset-1',
      name: 'OpenAI vs Claude',
      targetModels: [
        { providerProfileId: 'openai-main', modelId: 'gpt-4.1' },
        { providerProfileId: 'claude-main', modelId: 'claude-3-7-sonnet' }
      ],
      judgeProviderProfileId: 'openai-main',
      judgeModelId: 'gpt-4.1',
      sharedContextEnabled: true
    })

    expect(repository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'preset-1',
        name: 'OpenAI vs Claude',
        targetModelsJson: JSON.stringify([
          { providerProfileId: 'openai-main', modelId: 'gpt-4.1' },
          { providerProfileId: 'claude-main', modelId: 'claude-3-7-sonnet' }
        ]),
        judgeConfigJson: JSON.stringify({
          judgeProviderProfileId: 'openai-main',
          judgeModelId: 'gpt-4.1'
        }),
        sharedContextEnabled: true
      })
    )
  })

  it('tracks and resolves the active compare preset', async () => {
    const repository = {
      upsert: jest.fn(),
      listAll: jest.fn(async () => [
        {
          id: 'preset-1',
          name: 'Triad',
          targetModelsJson: JSON.stringify([
            { providerProfileId: 'openai-main', modelId: 'gpt-4.1' },
            { providerProfileId: 'gemini-main', modelId: 'gemini-2.5-pro' }
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
      ]),
      findById: jest.fn(async () => ({
        id: 'preset-1',
        name: 'Triad',
        targetModelsJson: JSON.stringify([
          { providerProfileId: 'openai-main', modelId: 'gpt-4.1' },
          { providerProfileId: 'gemini-main', modelId: 'gemini-2.5-pro' }
        ]),
        judgeConfigJson: JSON.stringify({
          judgeProviderProfileId: 'openai-main',
          judgeModelId: 'gpt-4.1'
        }),
        sharedContextEnabled: false,
        advancedParamsJson: '{}',
        createdAt: 10,
        updatedAt: 10
      }))
    }
    const preferences = {
      getValue: jest.fn(async () => JSON.stringify('preset-1')),
      setValue: jest.fn(async () => {})
    }
    const service = new ComparePresetService({
      repository: repository as never,
      preferenceRepository: preferences as never
    })

    await service.setActivePreset('preset-1')

    expect(preferences.setValue).toHaveBeenCalledWith('active_compare_preset_id', JSON.stringify('preset-1'))
    await expect(service.getActivePresetId()).resolves.toBe('preset-1')
    await expect(service.list()).resolves.toEqual([
      expect.objectContaining({
        id: 'preset-1',
        name: 'Triad',
        targetModels: [
          { providerProfileId: 'openai-main', modelId: 'gpt-4.1' },
          { providerProfileId: 'gemini-main', modelId: 'gemini-2.5-pro' }
        ],
        judgeProviderProfileId: 'openai-main',
        judgeModelId: 'gpt-4.1',
        sharedContextEnabled: false
      })
    ])
    await expect(service.getActivePreset()).resolves.toEqual(
      expect.objectContaining({
        id: 'preset-1',
        name: 'Triad'
      })
    )
  })
})
