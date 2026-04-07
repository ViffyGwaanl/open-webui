import type { ComparePresetRecord, NewComparePresetRecord } from '../storage/db/repositories/ComparePresetRepository'
import type { ComparePresetRepository } from '../storage/db/repositories/ComparePresetRepository'
import type { AppPreferenceRepository } from '../storage/db/repositories/AppPreferenceRepository'

const ACTIVE_COMPARE_PRESET_KEY = 'active_compare_preset_id'

type ComparePresetInput = {
  id: string
  name: string
  targetModels: Array<{
    providerProfileId: string
    modelId: string
  }>
  judgeProviderProfileId?: string | null
  judgeModelId: string | null
  sharedContextEnabled: boolean
}

export type ParsedComparePreset = {
  id: string
  name: string
  targetModels: Array<{
    providerProfileId: string
    modelId: string
  }>
  judgeProviderProfileId: string | null
  judgeModelId: string | null
  sharedContextEnabled: boolean
  advancedParams: Record<string, unknown>
  createdAt: number
  updatedAt: number
}

type ComparePresetRepositoryLike = Pick<ComparePresetRepository, 'upsert' | 'listAll' | 'findById'>
type PreferenceRepositoryLike = Pick<AppPreferenceRepository, 'getValue' | 'setValue'>

type ComparePresetServiceDeps = {
  repository?: ComparePresetRepositoryLike
  preferenceRepository?: PreferenceRepositoryLike
}

function createDefaultComparePresetRepository(): ComparePresetRepositoryLike {
  const { ComparePresetRepository } = require('../storage/db/repositories/ComparePresetRepository') as typeof import('../storage/db/repositories/ComparePresetRepository')
  return new ComparePresetRepository()
}

function createDefaultPreferenceRepository(): PreferenceRepositoryLike {
  const { AppPreferenceRepository } = require('../storage/db/repositories/AppPreferenceRepository') as typeof import('../storage/db/repositories/AppPreferenceRepository')
  return new AppPreferenceRepository()
}

function parseJsonValue<T>(valueJson: string, fallback: T): T {
  try {
    return JSON.parse(valueJson) as T
  } catch {
    return fallback
  }
}

function parseStoredString(valueJson: string | null): string | null {
  if (!valueJson) {
    return null
  }

  try {
    const parsed = JSON.parse(valueJson) as unknown
    return typeof parsed === 'string' ? parsed : null
  } catch {
    return null
  }
}

function parseRecord(record: ComparePresetRecord): ParsedComparePreset {
  const judgeConfig = parseJsonValue<{
    judgeProviderProfileId?: string | null
    judgeModelId?: string | null
  }>(record.judgeConfigJson, {})

  return {
    id: record.id,
    name: record.name,
    targetModels: parseJsonValue(record.targetModelsJson, []),
    judgeProviderProfileId: judgeConfig.judgeProviderProfileId ?? null,
    judgeModelId: judgeConfig.judgeModelId ?? null,
    sharedContextEnabled: record.sharedContextEnabled,
    advancedParams: parseJsonValue(record.advancedParamsJson, {}),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  }
}

export class ComparePresetService {
  private readonly repository: ComparePresetRepositoryLike
  private readonly preferenceRepository: PreferenceRepositoryLike

  constructor({
    repository = createDefaultComparePresetRepository(),
    preferenceRepository = createDefaultPreferenceRepository()
  }: ComparePresetServiceDeps = {}) {
    this.repository = repository
    this.preferenceRepository = preferenceRepository
  }

  async save(input: ComparePresetInput) {
    const now = Date.now()
    await this.repository.upsert({
      id: input.id,
      name: input.name,
      targetModelsJson: JSON.stringify(input.targetModels),
      judgeConfigJson: JSON.stringify({
        judgeProviderProfileId: input.judgeProviderProfileId ?? null,
        judgeModelId: input.judgeModelId
      }),
      sharedContextEnabled: input.sharedContextEnabled,
      advancedParamsJson: '{}',
      createdAt: now,
      updatedAt: now
    } satisfies NewComparePresetRecord)
  }

  async list(): Promise<ParsedComparePreset[]> {
    return (await this.repository.listAll()).map(parseRecord)
  }

  async getById(id: string): Promise<ParsedComparePreset | null> {
    const record = await this.repository.findById(id)
    return record ? parseRecord(record) : null
  }

  async setActivePreset(presetId: string) {
    await this.preferenceRepository.setValue(ACTIVE_COMPARE_PRESET_KEY, JSON.stringify(presetId))
  }

  async getActivePresetId(): Promise<string | null> {
    return parseStoredString(await this.preferenceRepository.getValue(ACTIVE_COMPARE_PRESET_KEY))
  }

  async getActivePreset(): Promise<ParsedComparePreset | null> {
    const activePresetId = await this.getActivePresetId()

    if (!activePresetId) {
      return null
    }

    return this.getById(activePresetId)
  }
}
