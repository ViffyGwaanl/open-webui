import type { NewComparePresetRecord } from '../storage/db/repositories/ComparePresetRepository'
import type { ComparePresetRepository } from '../storage/db/repositories/ComparePresetRepository'

type ComparePresetInput = {
  id: string
  name: string
  targetModels: Array<{
    providerProfileId: string
    modelId: string
  }>
  judgeModelId: string | null
  sharedContextEnabled: boolean
}

type ComparePresetRepositoryLike = Pick<ComparePresetRepository, 'upsert'>

function createDefaultComparePresetRepository(): ComparePresetRepositoryLike {
  const { ComparePresetRepository } = require('../storage/db/repositories/ComparePresetRepository') as typeof import('../storage/db/repositories/ComparePresetRepository')
  return new ComparePresetRepository()
}

export class ComparePresetService {
  constructor(
    private readonly repository: ComparePresetRepositoryLike = createDefaultComparePresetRepository()
  ) {}

  async save(input: ComparePresetInput) {
    const now = Date.now()
    await this.repository.upsert({
      id: input.id,
      name: input.name,
      targetModelsJson: JSON.stringify(input.targetModels),
      judgeConfigJson: JSON.stringify({
        judgeModelId: input.judgeModelId
      }),
      sharedContextEnabled: input.sharedContextEnabled,
      advancedParamsJson: '{}',
      createdAt: now,
      updatedAt: now
    } satisfies NewComparePresetRecord)
  }
}
