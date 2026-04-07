import * as FileSystem from 'expo-file-system/legacy'

import type { ComparePresetService } from './ComparePresetService'
import type { ProviderProfileService } from './ProviderProfileService'
import type { RagSingleTurnExecutionService } from './RagSingleTurnExecutionService'

const REVIEW_DEMO_PROFILE_ID = 'review-demo-main'
const REVIEW_DEMO_PRESET_ID = 'review-demo-compare'
const REVIEW_DEMO_DOCUMENT_NAME = 'review-demo-guide.md'
const REVIEW_DEMO_DOCUMENT_BODY = `# Review Demo Guide

This local-first workspace keeps chat, compare, and retrieval data on the device.

## Compare

Compare mode runs multiple model answers side by side and lets the user continue the best branch.

## Retrieval

Local RAG stores imported text and PDF sources on the device, builds local indexes, and injects shared evidence into answers.
`

type ProviderProfileServiceLike = Pick<ProviderProfileService, 'save'>
type ComparePresetServiceLike = Pick<ComparePresetService, 'save' | 'setActivePreset'>
type RagServiceLike = Pick<RagSingleTurnExecutionService, 'listDocuments' | 'importDocument'>
type FileSystemLike = Pick<typeof FileSystem, 'cacheDirectory' | 'writeAsStringAsync'>

type ReviewDemoServiceDeps = {
  providerProfileService?: ProviderProfileServiceLike
  comparePresetService?: ComparePresetServiceLike
  ragService?: RagServiceLike
  fileSystem?: FileSystemLike
}

function createDefaultProviderProfileService() {
  const { ProviderProfileService } = require('./ProviderProfileService') as typeof import('./ProviderProfileService')
  return new ProviderProfileService()
}

function createDefaultComparePresetService() {
  const { ComparePresetService } = require('./ComparePresetService') as typeof import('./ComparePresetService')
  return new ComparePresetService()
}

function createDefaultRagService() {
  const { RagSingleTurnExecutionService } = require('./RagSingleTurnExecutionService') as typeof import('./RagSingleTurnExecutionService')
  return new RagSingleTurnExecutionService()
}

export class ReviewDemoService {
  private readonly providerProfileService: ProviderProfileServiceLike
  private readonly comparePresetService: ComparePresetServiceLike
  private readonly ragService: RagServiceLike
  private readonly fileSystem: FileSystemLike

  constructor({
    providerProfileService = createDefaultProviderProfileService(),
    comparePresetService = createDefaultComparePresetService(),
    ragService = createDefaultRagService(),
    fileSystem = FileSystem
  }: ReviewDemoServiceDeps = {}) {
    this.providerProfileService = providerProfileService
    this.comparePresetService = comparePresetService
    this.ragService = ragService
    this.fileSystem = fileSystem
  }

  async install() {
    await this.providerProfileService.save({
      id: REVIEW_DEMO_PROFILE_ID,
      presetType: 'review-demo',
      displayName: 'Review Demo',
      baseUrl: 'local://review-demo'
    })

    await this.comparePresetService.save({
      id: REVIEW_DEMO_PRESET_ID,
      name: 'Review Demo Trio',
      targetModels: [
        { providerProfileId: REVIEW_DEMO_PROFILE_ID, modelId: 'review-demo-balanced' },
        { providerProfileId: REVIEW_DEMO_PROFILE_ID, modelId: 'review-demo-critic' },
        { providerProfileId: REVIEW_DEMO_PROFILE_ID, modelId: 'review-demo-creative' }
      ],
      judgeProviderProfileId: REVIEW_DEMO_PROFILE_ID,
      judgeModelId: 'review-demo-critic',
      sharedContextEnabled: true
    })
    await this.comparePresetService.setActivePreset(REVIEW_DEMO_PRESET_ID)

    const documents = await this.ragService.listDocuments()

    if (!documents.some((document) => document.displayName === REVIEW_DEMO_DOCUMENT_NAME)) {
      if (!this.fileSystem.cacheDirectory) {
        throw new Error('Cache directory is unavailable for review demo setup')
      }

      const uri = `${this.fileSystem.cacheDirectory}${REVIEW_DEMO_DOCUMENT_NAME}`
      await this.fileSystem.writeAsStringAsync(uri, REVIEW_DEMO_DOCUMENT_BODY)
      await this.ragService.importDocument({
        uri,
        name: REVIEW_DEMO_DOCUMENT_NAME,
        mimeType: 'text/markdown'
      })
    }

    return {
      profileId: REVIEW_DEMO_PROFILE_ID,
      presetId: REVIEW_DEMO_PRESET_ID
    }
  }
}
