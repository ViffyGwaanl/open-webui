import { describe, expect, it, jest } from '@jest/globals'

import { ComparePresetService } from '../ComparePresetService'

describe('ComparePresetService', () => {
  it('stores compare preset defaults as snapshot JSON payloads', async () => {
    const repository = {
      upsert: jest.fn()
    }
    const service = new ComparePresetService(repository as never)

    await service.save({
      id: 'preset-1',
      name: 'OpenAI vs Claude',
      targetModels: [
        { providerProfileId: 'openai-main', modelId: 'gpt-4.1' },
        { providerProfileId: 'claude-main', modelId: 'claude-3-7-sonnet' }
      ],
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
        judgeConfigJson: JSON.stringify({ judgeModelId: 'gpt-4.1' }),
        sharedContextEnabled: true
      })
    )
  })
})
