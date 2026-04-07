import { WORKSPACE_BACKUP_VERSION, type WorkspaceBackupBundle } from './backupManifest'

export function validateBackupBundle(bundle: WorkspaceBackupBundle) {
  if (bundle.version !== WORKSPACE_BACKUP_VERSION) {
    throw new Error(`Unsupported backup version ${bundle.version}`)
  }

  if (!bundle.mainDb || !bundle.ragDb || !Array.isArray(bundle.managedDocuments)) {
    throw new Error('Backup bundle is missing required sections')
  }

  return bundle
}
