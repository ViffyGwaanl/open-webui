import * as FileSystem from 'expo-file-system/legacy'

type ImportDocumentInput = {
  uri: string
  name: string
  fileType: 'txt' | 'md' | 'pdf'
}

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, '-').toLowerCase()
}

export class ImportedDocumentStore {
  private readonly baseDirectory = `${FileSystem.documentDirectory ?? ''}rag-library/`

  async copyIntoManagedStorage(input: ImportDocumentInput) {
    if (!FileSystem.documentDirectory) {
      throw new Error('Document storage directory is unavailable')
    }

    await FileSystem.makeDirectoryAsync(this.baseDirectory, { intermediates: true })

    const targetUri = `${this.baseDirectory}${Date.now()}-${sanitizeFileName(input.name)}`

    await FileSystem.copyAsync({
      from: input.uri,
      to: targetUri
    })

    const fileInfo = await FileSystem.getInfoAsync(targetUri, {
      md5: true
    })

    return {
      storageUri: targetUri,
      checksum: fileInfo.exists && 'md5' in fileInfo ? (fileInfo.md5 ?? `${input.fileType}-${input.name}`) : `${input.fileType}-${input.name}`,
      fileSize: fileInfo.exists && 'size' in fileInfo && typeof fileInfo.size === 'number' ? fileInfo.size : null
    }
  }
}
