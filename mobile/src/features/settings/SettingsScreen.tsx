import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useEffect, useState } from 'react'

import type { ProviderPreset } from '../../core/providers/types'
import { ComparePresetForm } from '../compare/ComparePresetForm'
import { ComparePresetPicker } from '../compare/ComparePresetPicker'
import { ProviderProfileForm } from './ProviderProfileForm'
import { BackupRestoreScreen } from './BackupRestoreScreen'
import { ReviewDemoCard } from './ReviewDemoCard'

type ProviderProfileSummary = {
  id: string
  displayName: string
  baseUrl: string
  presetType: string
}

type ParsedComparePreset = {
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

type CompareTarget = {
  providerProfileId: string
  providerLabel: string
  models: Array<{
    modelId: string
    label: string
  }>
}

type ProviderProfileRepositoryLike = {
  listAll: () => Promise<ProviderProfileSummary[]>
}

type ProviderProfileServiceLike = {
  save: (value: {
    id: string
    presetType: ProviderPreset
    displayName: string
    baseUrl: string
    apiKey: string
  }) => Promise<void>
}

type ComparePresetServiceLike = {
  list: () => Promise<ParsedComparePreset[]>
  getActivePresetId: () => Promise<string | null>
  setActivePreset: (presetId: string) => Promise<void>
  save: (value: {
    id: string
    name: string
    targetModels: Array<{
      providerProfileId: string
      modelId: string
    }>
    judgeProviderProfileId: string | null
    judgeModelId: string | null
    sharedContextEnabled: boolean
  }) => Promise<void>
}

type ProviderRuntimeServiceLike = {
  listModels: (profileId: string) => Promise<
    Array<{
      modelId: string
      label: string
      isEmbeddingModel?: boolean
    }>
  >
}

type ReviewDemoServiceLike = {
  install: () => Promise<{
    profileId: string
    presetId: string
  }>
}

type BackupServiceLike = {
  createBackup: () => Promise<{
    uri: string
    createdAt: number
  }>
}

type RestoreServiceLike = {
  restoreFromUri: (uri: string) => Promise<{
    restoredAt: number
    providerProfiles: number
    documents: number
    managedDocuments: number
  }>
}

type SettingsScreenProps = {
  providerProfileRepository?: ProviderProfileRepositoryLike
  providerProfileService?: ProviderProfileServiceLike
  comparePresetService?: ComparePresetServiceLike
  providerRuntimeService?: ProviderRuntimeServiceLike
  reviewDemoService?: ReviewDemoServiceLike
  backupService?: BackupServiceLike
  restoreService?: RestoreServiceLike
}

function createDefaultProviderProfileRepository(): ProviderProfileRepositoryLike {
  const { ProviderProfileRepository } = require('../../storage/db/repositories/ProviderProfileRepository') as typeof import('../../storage/db/repositories/ProviderProfileRepository')
  return new ProviderProfileRepository()
}

function createDefaultProviderProfileService(): ProviderProfileServiceLike {
  const { ProviderProfileService } = require('../../services/ProviderProfileService') as typeof import('../../services/ProviderProfileService')
  return new ProviderProfileService()
}

function createDefaultComparePresetService(): ComparePresetServiceLike {
  const { ComparePresetService } = require('../../services/ComparePresetService') as typeof import('../../services/ComparePresetService')
  return new ComparePresetService()
}

function createDefaultProviderRuntimeService(): ProviderRuntimeServiceLike {
  const { ProviderRuntimeService } = require('../../services/ProviderRuntimeService') as typeof import('../../services/ProviderRuntimeService')
  return new ProviderRuntimeService()
}

function createDefaultReviewDemoService(): ReviewDemoServiceLike {
  const { ReviewDemoService } = require('../../services/ReviewDemoService') as typeof import('../../services/ReviewDemoService')
  return new ReviewDemoService()
}

function createDefaultBackupService(): BackupServiceLike {
  const { BackupService } = require('../../services/backup/BackupService') as typeof import('../../services/backup/BackupService')
  return new BackupService()
}

function createDefaultRestoreService(): RestoreServiceLike {
  const { RestoreService } = require('../../services/backup/RestoreService') as typeof import('../../services/backup/RestoreService')
  return new RestoreService()
}

export function SettingsScreen({
  providerProfileRepository = createDefaultProviderProfileRepository(),
  providerProfileService = createDefaultProviderProfileService(),
  comparePresetService = createDefaultComparePresetService(),
  providerRuntimeService = createDefaultProviderRuntimeService(),
  reviewDemoService = createDefaultReviewDemoService(),
  backupService = createDefaultBackupService(),
  restoreService = createDefaultRestoreService()
}: SettingsScreenProps) {
  const [profiles, setProfiles] = useState<ProviderProfileSummary[]>([])
  const [comparePresets, setComparePresets] = useState<ParsedComparePreset[]>([])
  const [activeComparePresetId, setActiveComparePresetId] = useState<string | null>(null)
  const [compareTargets, setCompareTargets] = useState<CompareTarget[]>([])
  const [isInstallingReviewDemo, setIsInstallingReviewDemo] = useState(false)
  const [isCreatingBackup, setIsCreatingBackup] = useState(false)
  const [isRestoringBackup, setIsRestoringBackup] = useState(false)

  const loadComparePresets = async () => {
    const [loadedPresets, activePresetId] = await Promise.all([
      comparePresetService.list(),
      comparePresetService.getActivePresetId()
    ])

    setComparePresets(loadedPresets)
    setActiveComparePresetId(activePresetId)
  }

  const loadCompareTargets = async (currentProfiles: ProviderProfileSummary[]) => {
    const targets = (
      await Promise.all(
        currentProfiles.map(async (profile) => {
          try {
            const models = await providerRuntimeService.listModels(profile.id)
            const chatModels = models
              .filter((model) => !model.isEmbeddingModel)
              .map((model) => ({
                modelId: model.modelId,
                label: model.label
              }))

            if (chatModels.length === 0) {
              return null
            }

            return {
              providerProfileId: profile.id,
              providerLabel: profile.displayName,
              models: chatModels
            }
          } catch {
            return null
          }
        })
      )
    ).filter((target): target is CompareTarget => target !== null)

    setCompareTargets(targets)
  }

  const loadSettingsData = async () => {
    const loadedProfiles = await providerProfileRepository.listAll()
    setProfiles(loadedProfiles)
    await Promise.all([loadComparePresets(), loadCompareTargets(loadedProfiles)])
  }

  useEffect(() => {
    void loadSettingsData()
  }, [])

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <ProviderProfileForm
        onSubmit={async ({ presetType, displayName, baseUrl, apiKey }) => {
          await providerProfileService.save({
            id: `${presetType}-main`,
            presetType,
            displayName,
            baseUrl,
            apiKey
          })
          await loadSettingsData()
          Alert.alert('Saved', `${displayName} is ready for chat, compare, and RAG.`)
        }}
      />
      <View style={styles.profileList}>
        {profiles.map((profile) => (
          <View key={profile.id} style={styles.profileCard}>
            <Text style={styles.profileTitle}>{profile.displayName}</Text>
            <Text style={styles.profileMeta}>{profile.presetType}</Text>
            <Text style={styles.profileMeta}>{profile.baseUrl}</Text>
          </View>
        ))}
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Compare Presets</Text>
        <Text style={styles.sectionBody}>
          Save reusable compare lineups and choose which preset is active for thread compare runs.
        </Text>
        {comparePresets.length > 0 ? (
          <ComparePresetPicker
            presets={comparePresets}
            activePresetId={activeComparePresetId}
            onSelect={async (presetId) => {
              await comparePresetService.setActivePreset(presetId)
              setActiveComparePresetId(presetId)
              Alert.alert('Preset Active', 'Compare will use this preset by default.')
            }}
          />
        ) : (
          <Text style={styles.emptyState}>No compare preset saved yet.</Text>
        )}
        {compareTargets.length >= 2 ? (
          <ComparePresetForm
            providerTargets={compareTargets}
            onSubmit={async (input) => {
              const presetId = `compare-preset-${Date.now()}`

              await comparePresetService.save({
                id: presetId,
                name: input.name,
                targetModels: input.targetModels,
                judgeProviderProfileId: input.judgeProviderProfileId,
                judgeModelId: input.judgeModelId,
                sharedContextEnabled: input.sharedContextEnabled
              })
              await comparePresetService.setActivePreset(presetId)
              await loadComparePresets()
              Alert.alert('Preset Saved', `${input.name} is now the active compare preset.`)
            }}
          />
        ) : (
          <Text style={styles.emptyState}>
            Configure at least two provider profiles with chat-capable models to build compare presets.
          </Text>
        )}
      </View>
      <ReviewDemoCard
        isInstalling={isInstallingReviewDemo}
        onInstall={async () => {
          try {
            setIsInstallingReviewDemo(true)
            const result = await reviewDemoService.install()
            await loadSettingsData()
            Alert.alert(
              'Review Demo Ready',
              `Installed review-demo-main assets for ${result.profileId} with active preset ${result.presetId}.`
            )
          } catch (error) {
            Alert.alert('Review Demo Failed', error instanceof Error ? error.message : 'Unknown error')
          } finally {
            setIsInstallingReviewDemo(false)
          }
        }}
      />
      <BackupRestoreScreen
        isCreatingBackup={isCreatingBackup}
        isRestoringBackup={isRestoringBackup}
        onCreateBackup={async () => {
          try {
            setIsCreatingBackup(true)
            const result = await backupService.createBackup()
            Alert.alert('Backup Created', `Saved local workspace backup to ${result.uri}.`)
          } catch (error) {
            Alert.alert('Backup Failed', error instanceof Error ? error.message : 'Unknown error')
          } finally {
            setIsCreatingBackup(false)
          }
        }}
        onRestoreBackup={async (uri) => {
          const normalizedUri = uri.trim()

          if (normalizedUri.length === 0) {
            Alert.alert('Restore Failed', 'Enter a backup file URI before restoring.')
            return
          }

          try {
            setIsRestoringBackup(true)
            const result = await restoreService.restoreFromUri(normalizedUri)
            await loadSettingsData()
            Alert.alert(
              'Restore Completed',
              `Restored ${result.providerProfiles} provider profiles, ${result.documents} documents, and ${result.managedDocuments} managed documents.`
            )
          } catch (error) {
            Alert.alert('Restore Failed', error instanceof Error ? error.message : 'Unknown error')
          } finally {
            setIsRestoringBackup(false)
          }
        }}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 24
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16
  },
  profileList: {
    marginTop: 24,
    gap: 12
  },
  profileCard: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#f3f4f6',
    gap: 4
  },
  profileTitle: {
    fontWeight: '700',
    color: '#111827'
  },
  profileMeta: {
    color: '#4b5563'
  },
  section: {
    gap: 14
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827'
  },
  sectionBody: {
    color: '#4b5563',
    lineHeight: 22
  },
  emptyState: {
    color: '#64748b',
    lineHeight: 22
  }
})
