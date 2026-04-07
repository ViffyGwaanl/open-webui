import type { AdapterModelDescriptor } from '../core/providers/types'
import type { ComparePresetRecord } from '../storage/db/repositories/ComparePresetRepository'

type StoredProviderProfileRecord = {
  id: string
  presetType: string
  displayName: string
  baseUrl: string
  apiKeyRef: string
  extraHeadersJson: string
  enabled: boolean
}

type ChatTarget = {
  providerProfileId: string
  providerLabel: string
  modelId: string
  modelLabel: string
}

type CompareTargets = {
  presetId: string | null
  sharedContextEnabled: boolean
  branches: ChatTarget[]
  judge: ChatTarget | null
}

type ProfilesRepositoryLike = {
  listAll: () => Promise<StoredProviderProfileRecord[]>
}

type ComparePresetRepositoryLike = {
  findById: (id: string) => Promise<ComparePresetRecord | null>
}

type PreferenceRepositoryLike = {
  getValue: (key: string) => Promise<string | null>
}

type ProviderRuntimeServiceLike = {
  listModels: (providerProfileId: string) => Promise<AdapterModelDescriptor[]>
}

type DefaultModelSelectionServiceDeps = {
  profilesRepository: ProfilesRepositoryLike
  comparePresetRepository: ComparePresetRepositoryLike
  preferenceRepository: PreferenceRepositoryLike
  providerRuntimeService: ProviderRuntimeServiceLike
}

function createDefaultProfilesRepository(): ProfilesRepositoryLike {
  const { ProviderProfileRepository } = require('../storage/db/repositories/ProviderProfileRepository') as typeof import('../storage/db/repositories/ProviderProfileRepository')
  return new ProviderProfileRepository()
}

function createDefaultProviderRuntimeService(): ProviderRuntimeServiceLike {
  const { ProviderRuntimeService } = require('./ProviderRuntimeService') as typeof import('./ProviderRuntimeService')
  return new ProviderRuntimeService()
}

function createDefaultComparePresetRepository(): ComparePresetRepositoryLike {
  const { ComparePresetRepository } = require('../storage/db/repositories/ComparePresetRepository') as typeof import('../storage/db/repositories/ComparePresetRepository')
  return new ComparePresetRepository()
}

function createDefaultPreferenceRepository(): PreferenceRepositoryLike {
  const { AppPreferenceRepository } = require('../storage/db/repositories/AppPreferenceRepository') as typeof import('../storage/db/repositories/AppPreferenceRepository')
  return new AppPreferenceRepository()
}

type StoredTargetModel = {
  providerProfileId: string
  modelId: string
}

type StoredJudgeConfig = {
  judgeProviderProfileId?: string | null
  judgeModelId?: string | null
}

function parseJsonValue<T>(valueJson: string | null, fallback: T): T {
  if (!valueJson) {
    return fallback
  }

  try {
    return JSON.parse(valueJson) as T
  } catch {
    return fallback
  }
}

export class DefaultModelSelectionService {
  private readonly profilesRepository: ProfilesRepositoryLike
  private readonly comparePresetRepository: ComparePresetRepositoryLike
  private readonly preferenceRepository: PreferenceRepositoryLike
  private readonly providerRuntimeService: ProviderRuntimeServiceLike

  constructor(deps: Partial<DefaultModelSelectionServiceDeps> = {}) {
    this.profilesRepository = deps.profilesRepository ?? createDefaultProfilesRepository()
    this.comparePresetRepository = deps.comparePresetRepository ?? createDefaultComparePresetRepository()
    this.preferenceRepository = deps.preferenceRepository ?? createDefaultPreferenceRepository()
    this.providerRuntimeService = deps.providerRuntimeService ?? createDefaultProviderRuntimeService()
  }

  async resolveSingleChatTarget(): Promise<ChatTarget> {
    return this.findFirstMatchingTarget((model) => !model.isEmbeddingModel)
  }

  async resolveEmbeddingTarget(): Promise<ChatTarget> {
    return this.findFirstMatchingTarget((model) => model.isEmbeddingModel)
  }

  async resolveCompareTargets(): Promise<CompareTargets> {
    const configured = await this.resolvePresetCompareTargets()

    if (configured) {
      return configured
    }

    const profiles = await this.listEnabledProfiles()
    const branches: ChatTarget[] = []

    for (const profile of profiles) {
      const models = await this.providerRuntimeService.listModels(profile.id)
      const chatModel = models.find((model) => !model.isEmbeddingModel)

      if (!chatModel) {
        continue
      }

      branches.push({
        providerProfileId: profile.id,
        providerLabel: profile.displayName,
        modelId: chatModel.modelId,
        modelLabel: chatModel.label
      })

      if (branches.length === 2) {
        return {
          presetId: null,
          sharedContextEnabled: false,
          branches: [branches[0], branches[1]],
          judge: branches[0]
        }
      }
    }

    throw new Error('At least two enabled provider chat models are required for compare')
  }

  private async findFirstMatchingTarget(match: (model: AdapterModelDescriptor) => boolean): Promise<ChatTarget> {
    const profiles = await this.listEnabledProfiles()

    for (const profile of profiles) {
      const models = await this.providerRuntimeService.listModels(profile.id)
      const model = models.find(match)

      if (!model) {
        continue
      }

      return {
        providerProfileId: profile.id,
        providerLabel: profile.displayName,
        modelId: model.modelId,
        modelLabel: model.label
      }
    }

    throw new Error('No enabled model target is configured')
  }

  private async listEnabledProfiles() {
    const profiles = await this.profilesRepository.listAll()
    return profiles.filter((profile) => profile.enabled)
  }

  private async resolvePresetCompareTargets(): Promise<CompareTargets | null> {
    const activePresetId = parseJsonValue<string | null>(
      await this.preferenceRepository.getValue('active_compare_preset_id'),
      null
    )

    if (!activePresetId) {
      return null
    }

    const preset = await this.comparePresetRepository.findById(activePresetId)

    if (!preset) {
      return null
    }

    const profiles = await this.listEnabledProfiles()
    const targetModels = parseJsonValue<StoredTargetModel[]>(preset.targetModelsJson, [])
    const judgeConfig = parseJsonValue<StoredJudgeConfig>(preset.judgeConfigJson, {})
    const branches = (
      await Promise.all(targetModels.map((target) => this.resolveConfiguredTarget(target, profiles)))
    ).filter((target): target is ChatTarget => target !== null)

    if (branches.length < 2) {
      return null
    }

    const judge = await this.resolveConfiguredJudge(judgeConfig, branches, profiles)

    return {
      presetId: preset.id,
      sharedContextEnabled: preset.sharedContextEnabled,
      branches,
      judge
    }
  }

  private async resolveConfiguredTarget(
    target: StoredTargetModel,
    profiles: StoredProviderProfileRecord[]
  ): Promise<ChatTarget | null> {
    const profile = profiles.find((entry) => entry.id === target.providerProfileId)

    if (!profile) {
      return null
    }

    const models = await this.providerRuntimeService.listModels(profile.id)
    const model = models.find((entry) => entry.modelId === target.modelId)

    return {
      providerProfileId: profile.id,
      providerLabel: profile.displayName,
      modelId: target.modelId,
      modelLabel: model?.label ?? target.modelId
    }
  }

  private async resolveConfiguredJudge(
    judgeConfig: StoredJudgeConfig,
    branches: ChatTarget[],
    profiles: StoredProviderProfileRecord[]
  ): Promise<ChatTarget | null> {
    if (!judgeConfig.judgeModelId) {
      return null
    }

    if (judgeConfig.judgeProviderProfileId) {
      return this.resolveConfiguredTarget(
        {
          providerProfileId: judgeConfig.judgeProviderProfileId,
          modelId: judgeConfig.judgeModelId
        },
        profiles
      )
    }

    return branches.find((branch) => branch.modelId === judgeConfig.judgeModelId) ?? null
  }
}
