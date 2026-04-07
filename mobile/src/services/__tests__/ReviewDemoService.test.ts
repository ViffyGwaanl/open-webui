import { describe, expect, it, jest } from '@jest/globals'

import { ReviewDemoService } from '../ReviewDemoService'

describe('ReviewDemoService', () => {
  it('installs the review-demo provider, preset, and sample document', async () => {
    const providerProfileService = {
      save: jest.fn(async () => {})
    }
    const comparePresetService = {
      save: jest.fn(async () => {}),
      setActivePreset: jest.fn(async () => {})
    }
    const ragService = {
      listDocuments: jest.fn(async () => []),
      importDocument: jest.fn(async () => ({ id: 'doc-review-demo' }))
    }
    const fileSystem = {
      cacheDirectory: 'file:///cache/',
      writeAsStringAsync: jest.fn(async () => {})
    }
    const service = new ReviewDemoService({
      providerProfileService: providerProfileService as never,
      comparePresetService: comparePresetService as never,
      ragService: ragService as never,
      fileSystem: fileSystem as never
    })

    const result = await service.install()

    expect(providerProfileService.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'review-demo-main',
        presetType: 'review-demo'
      })
    )
    expect(comparePresetService.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'review-demo-compare',
        targetModels: expect.arrayContaining([
          expect.objectContaining({ modelId: 'review-demo-balanced' }),
          expect.objectContaining({ modelId: 'review-demo-critic' })
        ])
      })
    )
    expect(comparePresetService.setActivePreset).toHaveBeenCalledWith('review-demo-compare')
    expect(ragService.importDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'review-demo-guide.md',
        mimeType: 'text/markdown'
      })
    )
    expect(result).toEqual(
      expect.objectContaining({
        profileId: 'review-demo-main',
        presetId: 'review-demo-compare'
      })
    )
  })
})
