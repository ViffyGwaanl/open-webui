import type { AdapterModelDescriptor } from '../core/providers/types'

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
  branches: [ChatTarget, ChatTarget]
  judge: ChatTarget
}

type ProfilesRepositoryLike = {
  listAll: () => Promise<StoredProviderProfileRecord[]>
}

type ProviderRuntimeServiceLike = {
  listModels: (providerProfileId: string) => Promise<AdapterModelDescriptor[]>
}

type DefaultModelSelectionServiceDeps = {
  profilesRepository: ProfilesRepositoryLike
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

export class DefaultModelSelectionService {
  private readonly profilesRepository: ProfilesRepositoryLike
  private readonly providerRuntimeService: ProviderRuntimeServiceLike

  constructor({
    profilesRepository = createDefaultProfilesRepository(),
    providerRuntimeService = createDefaultProviderRuntimeService()
  }: Partial<DefaultModelSelectionServiceDeps> = {}) {
    this.profilesRepository = profilesRepository
    this.providerRuntimeService = providerRuntimeService
  }

  async resolveSingleChatTarget(): Promise<ChatTarget> {
    return this.findFirstMatchingTarget((model) => !model.isEmbeddingModel)
  }

  async resolveEmbeddingTarget(): Promise<ChatTarget> {
    return this.findFirstMatchingTarget((model) => model.isEmbeddingModel)
  }

  async resolveCompareTargets(): Promise<CompareTargets> {
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
}
