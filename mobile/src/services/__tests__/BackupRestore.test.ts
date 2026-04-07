import { describe, expect, it, jest } from '@jest/globals'

import { BackupService } from '../backup/BackupService'
import { RestoreService } from '../backup/RestoreService'

describe('Backup and restore', () => {
  it('serializes local workspace state into a backup file', async () => {
    const fileSystem = {
      documentDirectory: 'file:///documents/',
      makeDirectoryAsync: jest.fn(async () => {}),
      writeAsStringAsync: jest.fn(async () => {})
    }
    const backupService = new BackupService({
      fileSystem: fileSystem as never,
      loadMainDbSnapshot: async () => ({ threads: [{ id: 'thread-1' }] }),
      loadRagDbSnapshot: async () => ({ documents: [{ id: 'doc-1' }] }),
      loadManagedDocuments: async () => [
        {
          name: 'guide.md',
          contentBase64: 'Z3VpZGU='
        }
      ],
      now: () => 100
    })

    const result = await backupService.createBackup()

    expect(fileSystem.writeAsStringAsync).toHaveBeenCalledWith(
      'file:///documents/backups/workspace-100.json',
      expect.stringContaining('"threads"')
    )
    expect(result).toEqual({
      uri: 'file:///documents/backups/workspace-100.json',
      createdAt: 100
    })
  })

  it('validates and restores a backup bundle into the local workspace', async () => {
    const fileSystem = {
      readAsStringAsync: jest.fn(async () =>
        JSON.stringify({
          version: 1,
          createdAt: 100,
          mainDb: { providerProfiles: [{ id: 'openai-main', presetType: 'openai', enabled: true }] },
          ragDb: { documents: [{ id: 'doc-1' }] },
          managedDocuments: [{ name: 'guide.md', contentBase64: 'Z3VpZGU=' }]
        })
      )
    }
    const restoreService = new RestoreService({
      fileSystem: fileSystem as never,
      replaceMainDbSnapshot: jest.fn(async () => {}),
      replaceRagDbSnapshot: jest.fn(async () => {}),
      restoreManagedDocuments: jest.fn(async () => {})
    })

    const result = await restoreService.restoreFromUri('file:///documents/backups/workspace-100.json')

    expect(result).toEqual({
      restoredAt: 100,
      providerProfiles: 1,
      documents: 1,
      managedDocuments: 1
    })
  })

  it('rejects managed document names that escape the backup directory', async () => {
    const fileSystem = {
      readAsStringAsync: jest.fn(async () =>
        JSON.stringify({
          version: 1,
          createdAt: 100,
          mainDb: { providerProfiles: [] },
          ragDb: { documents: [] },
          managedDocuments: [{ name: '../escape.txt', contentBase64: 'ZGFuZ2Vy' }]
        })
      )
    }
    const restoreManagedDocuments = jest.fn(async () => {})
    const restoreService = new RestoreService({
      fileSystem: fileSystem as never,
      replaceMainDbSnapshot: jest.fn(async () => {}),
      replaceRagDbSnapshot: jest.fn(async () => {}),
      restoreManagedDocuments
    })

    await expect(
      restoreService.restoreFromUri('file:///documents/backups/workspace-100.json')
    ).rejects.toThrow('Invalid managed document name')
    expect(restoreManagedDocuments).not.toHaveBeenCalled()
  })
})
