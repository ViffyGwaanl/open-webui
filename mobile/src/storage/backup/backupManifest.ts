export const WORKSPACE_BACKUP_VERSION = 1

export type WorkspaceBackupBundle = {
  version: number
  createdAt: number
  mainDb: Record<string, unknown[]>
  ragDb: Record<string, unknown[]>
  managedDocuments: Array<{
    name: string
    contentBase64: string
  }>
}
