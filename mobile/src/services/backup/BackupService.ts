import * as FileSystem from 'expo-file-system/legacy'

import { WORKSPACE_BACKUP_VERSION } from '../../storage/backup/backupManifest'
import { serializeBackup } from '../../storage/backup/backupSerializer'

type FileSystemLike = Pick<typeof FileSystem, 'documentDirectory' | 'writeAsStringAsync' | 'makeDirectoryAsync'>

type BackupServiceDeps = {
  fileSystem?: FileSystemLike
  loadMainDbSnapshot?: () => Promise<Record<string, unknown[]>>
  loadRagDbSnapshot?: () => Promise<Record<string, unknown[]>>
  loadManagedDocuments?: () => Promise<Array<{ name: string; contentBase64: string }>>
  now?: () => number
}

function createDefaultLoadMainDbSnapshot() {
  return async () => {
    const { db } = require('../../storage/db/client') as typeof import('../../storage/db/client')
    const schema = await import('../../storage/db/schema')

    const tables = {
      appPreferences: schema.appPreferences,
      comparePresets: schema.comparePresets,
      compareRuns: schema.compareRuns,
      compareBranches: schema.compareBranches,
      judgeRuns: schema.judgeRuns,
      modelCatalog: schema.modelCatalog,
      providerProfiles: schema.providerProfiles,
      threads: schema.threads,
      turnRetrievalContexts: schema.turnRetrievalContexts,
      turnRetrievalItems: schema.turnRetrievalItems,
      turns: schema.turns
    }

    return Object.fromEntries(
      await Promise.all(
        Object.entries(tables).map(async ([key, table]) => [key, await db.select().from(table)])
      )
    )
  }
}

function createDefaultLoadRagDbSnapshot() {
  return async () => {
    const { indexDb } = require('../../storage/index-db/client') as typeof import('../../storage/index-db/client')
    const schema = await import('../../storage/index-db/schema')

    const tables = {
      documents: schema.documents,
      documentTexts: schema.documentTexts,
      documentChunks: schema.documentChunks,
      indexJobs: schema.indexJobs
    }

    return Object.fromEntries(
      await Promise.all(
        Object.entries(tables).map(async ([key, table]) => [key, await indexDb.select().from(table)])
      )
    )
  }
}

function createDefaultLoadManagedDocuments() {
  return async () => {
    const { ImportedDocumentStore } = require('../../storage/files/ImportedDocumentStore') as typeof import('../../storage/files/ImportedDocumentStore')
    return new ImportedDocumentStore().exportManagedDocuments()
  }
}

export class BackupService {
  private readonly fileSystem: FileSystemLike
  private readonly loadMainDbSnapshot: NonNullable<BackupServiceDeps['loadMainDbSnapshot']>
  private readonly loadRagDbSnapshot: NonNullable<BackupServiceDeps['loadRagDbSnapshot']>
  private readonly loadManagedDocuments: NonNullable<BackupServiceDeps['loadManagedDocuments']>
  private readonly now: () => number

  constructor({
    fileSystem = FileSystem,
    loadMainDbSnapshot = createDefaultLoadMainDbSnapshot(),
    loadRagDbSnapshot = createDefaultLoadRagDbSnapshot(),
    loadManagedDocuments = createDefaultLoadManagedDocuments(),
    now = () => Date.now()
  }: BackupServiceDeps = {}) {
    this.fileSystem = fileSystem
    this.loadMainDbSnapshot = loadMainDbSnapshot
    this.loadRagDbSnapshot = loadRagDbSnapshot
    this.loadManagedDocuments = loadManagedDocuments
    this.now = now
  }

  async createBackup() {
    if (!this.fileSystem.documentDirectory) {
      throw new Error('Document directory is unavailable for backups')
    }

    const createdAt = this.now()
    const backupDirectory = `${this.fileSystem.documentDirectory}backups/`
    const uri = `${backupDirectory}workspace-${createdAt}.json`
    const bundle = {
      version: WORKSPACE_BACKUP_VERSION,
      createdAt,
      mainDb: await this.loadMainDbSnapshot(),
      ragDb: await this.loadRagDbSnapshot(),
      managedDocuments: await this.loadManagedDocuments()
    }

    await this.fileSystem.makeDirectoryAsync(backupDirectory, { intermediates: true })
    await this.fileSystem.writeAsStringAsync(uri, serializeBackup(bundle))

    return {
      uri,
      createdAt
    }
  }
}
