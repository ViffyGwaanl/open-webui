import type { WorkspaceBackupBundle } from './backupManifest'

export function serializeBackup(bundle: WorkspaceBackupBundle) {
  return JSON.stringify(bundle)
}

export function deserializeBackup(serialized: string) {
  return JSON.parse(serialized) as WorkspaceBackupBundle
}
