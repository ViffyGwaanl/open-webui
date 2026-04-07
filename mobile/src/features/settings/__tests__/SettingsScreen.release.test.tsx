import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'
import { Alert } from 'react-native'
import { describe, expect, it, jest, beforeEach } from '@jest/globals'

import { SettingsScreen } from '../SettingsScreen'

describe('SettingsScreen release tools', () => {
  const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {})

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('installs the review demo profile and shows a success alert', async () => {
    const reviewDemoService = {
      install: jest.fn(async () => ({
        profileId: 'review-demo-main',
        presetId: 'review-demo-compare'
      }))
    }

    render(
      <SettingsScreen
        providerProfileRepository={{ listAll: async () => [] } as never}
        providerProfileService={{ save: jest.fn(async () => {}) } as never}
        comparePresetService={{
          list: async () => [],
          getActivePresetId: async () => null,
          setActivePreset: jest.fn(async () => {}),
          save: jest.fn(async () => {})
        } as never}
        providerRuntimeService={{ listModels: jest.fn(async () => []) } as never}
        reviewDemoService={reviewDemoService as never}
        backupService={{ createBackup: jest.fn(async () => ({ uri: 'file:///backup.json', createdAt: 1 })) } as never}
        restoreService={{ restoreFromUri: jest.fn(async () => ({ restoredAt: 1, providerProfiles: 1, documents: 1, managedDocuments: 1 })) } as never}
      />
    )

    fireEvent.press(await screen.findByText('Install Review Demo'))

    await waitFor(() => {
      expect(reviewDemoService.install).toHaveBeenCalledTimes(1)
      expect(alertSpy).toHaveBeenCalledWith(
        'Review Demo Ready',
        expect.stringContaining('review-demo-main')
      )
    })
  })

  it('creates a local workspace backup and shows the saved uri', async () => {
    const backupService = {
      createBackup: jest.fn(async () => ({
        uri: 'file:///documents/backups/workspace-100.json',
        createdAt: 100
      }))
    }

    render(
      <SettingsScreen
        providerProfileRepository={{ listAll: async () => [] } as never}
        providerProfileService={{ save: jest.fn(async () => {}) } as never}
        comparePresetService={{
          list: async () => [],
          getActivePresetId: async () => null,
          setActivePreset: jest.fn(async () => {}),
          save: jest.fn(async () => {})
        } as never}
        providerRuntimeService={{ listModels: jest.fn(async () => []) } as never}
        reviewDemoService={{ install: jest.fn(async () => ({ profileId: 'review-demo-main', presetId: 'review-demo-compare' })) } as never}
        backupService={backupService as never}
        restoreService={{ restoreFromUri: jest.fn(async () => ({ restoredAt: 1, providerProfiles: 1, documents: 1, managedDocuments: 1 })) } as never}
      />
    )

    fireEvent.press(await screen.findByText('Create Backup'))

    await waitFor(() => {
      expect(backupService.createBackup).toHaveBeenCalledTimes(1)
      expect(alertSpy).toHaveBeenCalledWith(
        'Backup Created',
        expect.stringContaining('workspace-100.json')
      )
    })
  })

  it('restores a backup from the provided uri and shows the restored counts', async () => {
    const restoreService = {
      restoreFromUri: jest.fn(async () => ({
        restoredAt: 100,
        providerProfiles: 2,
        documents: 3,
        managedDocuments: 1
      }))
    }

    render(
      <SettingsScreen
        providerProfileRepository={{ listAll: async () => [] } as never}
        providerProfileService={{ save: jest.fn(async () => {}) } as never}
        comparePresetService={{
          list: async () => [],
          getActivePresetId: async () => null,
          setActivePreset: jest.fn(async () => {}),
          save: jest.fn(async () => {})
        } as never}
        providerRuntimeService={{ listModels: jest.fn(async () => []) } as never}
        reviewDemoService={{ install: jest.fn(async () => ({ profileId: 'review-demo-main', presetId: 'review-demo-compare' })) } as never}
        backupService={{ createBackup: jest.fn(async () => ({ uri: 'file:///backup.json', createdAt: 1 })) } as never}
        restoreService={restoreService as never}
      />
    )

    fireEvent.changeText(
      await screen.findByPlaceholderText('Backup file URI'),
      'file:///documents/backups/workspace-100.json'
    )
    fireEvent.press(screen.getByText('Restore Backup'))

    await waitFor(() => {
      expect(restoreService.restoreFromUri).toHaveBeenCalledWith(
        'file:///documents/backups/workspace-100.json'
      )
      expect(alertSpy).toHaveBeenCalledWith(
        'Restore Completed',
        expect.stringContaining('3 documents')
      )
    })
  })
})
