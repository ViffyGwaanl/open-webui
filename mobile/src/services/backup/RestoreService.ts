import * as FileSystem from 'expo-file-system/legacy'

import { deserializeBackup } from '../../storage/backup/backupSerializer'
import { validateBackupBundle } from '../../storage/backup/restoreValidator'

type FileSystemLike = Pick<typeof FileSystem, 'readAsStringAsync'>

type RestoreServiceDeps = {
  fileSystem?: FileSystemLike
  replaceMainDbSnapshot?: (snapshot: Record<string, unknown[]>) => Promise<void>
  replaceRagDbSnapshot?: (snapshot: Record<string, unknown[]>) => Promise<void>
  restoreManagedDocuments?: (documents: Array<{ name: string; contentBase64: string }>) => Promise<void>
}

function assertManagedDocumentName(name: string) {
  if (
    name.length === 0 ||
    name.includes('/') ||
    name.includes('\\') ||
    name.includes('..')
  ) {
    throw new Error(`Invalid managed document name: ${name}`)
  }
}

function createDefaultReplaceMainDbSnapshot() {
  return async (snapshot: Record<string, unknown[]>) => {
    const { db } = require('../../storage/db/client') as typeof import('../../storage/db/client')
    const schema = await import('../../storage/db/schema')

    const orderedTables = [
      schema.turnRetrievalItems,
      schema.turnRetrievalContexts,
      schema.judgeRuns,
      schema.compareBranches,
      schema.compareRuns,
      schema.comparePresets,
      schema.turns,
      schema.threads,
      schema.modelCatalog,
      schema.providerProfiles,
      schema.appPreferences
    ]

    for (const table of orderedTables) {
      await db.delete(table)
    }

    const orderedTableEntries = [
      ['appPreferences', schema.appPreferences],
      ['providerProfiles', schema.providerProfiles],
      ['modelCatalog', schema.modelCatalog],
      ['threads', schema.threads],
      ['turns', schema.turns],
      ['comparePresets', schema.comparePresets],
      ['compareRuns', schema.compareRuns],
      ['compareBranches', schema.compareBranches],
      ['judgeRuns', schema.judgeRuns],
      ['turnRetrievalContexts', schema.turnRetrievalContexts],
      ['turnRetrievalItems', schema.turnRetrievalItems]
    ] as const

    for (const [key, table] of orderedTableEntries) {
      const rows = (snapshot[key] ?? []).map((row) => {
        if (key !== 'providerProfiles') {
          return row
        }

        const providerProfile = row as Record<string, unknown>
        return {
          ...providerProfile,
          enabled: providerProfile.presetType === 'review-demo' ? providerProfile.enabled : false
        }
      })

      if (rows.length > 0) {
        await db.insert(table).values(rows as never)
      }
    }
  }
}

function createDefaultReplaceRagDbSnapshot() {
  return async (snapshot: Record<string, unknown[]>) => {
    const { indexDb } = require('../../storage/index-db/client') as typeof import('../../storage/index-db/client')
    const schema = await import('../../storage/index-db/schema')

    const orderedTables = [
      schema.documentChunks,
      schema.documentTexts,
      schema.indexJobs,
      schema.documents
    ]

    for (const table of orderedTables) {
      await indexDb.delete(table)
    }

    const tables = {
      documents: schema.documents,
      documentTexts: schema.documentTexts,
      documentChunks: schema.documentChunks,
      indexJobs: schema.indexJobs
    }

    for (const [key, table] of Object.entries(tables)) {
      const rows = snapshot[key] ?? []

      if (rows.length > 0) {
        await indexDb.insert(table).values(rows as never)
      }
    }
  }
}

function createDefaultRestoreManagedDocuments() {
  return async (documents: Array<{ name: string; contentBase64: string }>) => {
    const { ImportedDocumentStore } = require('../../storage/files/ImportedDocumentStore') as typeof import('../../storage/files/ImportedDocumentStore')
    await new ImportedDocumentStore().replaceManagedDocuments(documents)
  }
}

export class RestoreService {
  private readonly fileSystem: FileSystemLike
  private readonly replaceMainDbSnapshot: NonNullable<RestoreServiceDeps['replaceMainDbSnapshot']>
  private readonly replaceRagDbSnapshot: NonNullable<RestoreServiceDeps['replaceRagDbSnapshot']>
  private readonly restoreManagedDocuments: NonNullable<RestoreServiceDeps['restoreManagedDocuments']>

  constructor({
    fileSystem = FileSystem,
    replaceMainDbSnapshot = createDefaultReplaceMainDbSnapshot(),
    replaceRagDbSnapshot = createDefaultReplaceRagDbSnapshot(),
    restoreManagedDocuments = createDefaultRestoreManagedDocuments()
  }: RestoreServiceDeps = {}) {
    this.fileSystem = fileSystem
    this.replaceMainDbSnapshot = replaceMainDbSnapshot
    this.replaceRagDbSnapshot = replaceRagDbSnapshot
    this.restoreManagedDocuments = restoreManagedDocuments
  }

  async restoreFromUri(uri: string) {
    const serialized = await this.fileSystem.readAsStringAsync(uri)
    const bundle = validateBackupBundle(deserializeBackup(serialized))
    bundle.managedDocuments.forEach((document) => {
      assertManagedDocumentName(document.name)
    })

    await this.replaceMainDbSnapshot(bundle.mainDb)
    await this.replaceRagDbSnapshot(bundle.ragDb)
    await this.restoreManagedDocuments(bundle.managedDocuments)

    return {
      restoredAt: bundle.createdAt,
      providerProfiles: (bundle.mainDb.providerProfiles ?? []).length,
      documents: (bundle.ragDb.documents ?? []).length,
      managedDocuments: bundle.managedDocuments.length
    }
  }
}
