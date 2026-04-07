import * as FileSystem from 'expo-file-system/legacy'

type ImportDocumentInput = {
  uri: string
  name: string
  fileType: 'txt' | 'md' | 'pdf'
}

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, '-').toLowerCase()
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

  async exportManagedDocuments() {
    if (!FileSystem.documentDirectory) {
      return []
    }

    const directoryInfo = await FileSystem.getInfoAsync(this.baseDirectory)

    if (!directoryInfo.exists) {
      return []
    }

    const files = await FileSystem.readDirectoryAsync(this.baseDirectory)

    return Promise.all(
      files.map(async (name) => ({
        name,
        contentBase64: await FileSystem.readAsStringAsync(`${this.baseDirectory}${name}`, {
          encoding: FileSystem.EncodingType.Base64
        })
      }))
    )
  }

  async replaceManagedDocuments(documents: Array<{ name: string; contentBase64: string }>) {
    if (!FileSystem.documentDirectory) {
      throw new Error('Document storage directory is unavailable')
    }

    await FileSystem.deleteAsync(this.baseDirectory, { idempotent: true })
    await FileSystem.makeDirectoryAsync(this.baseDirectory, { intermediates: true })

    await Promise.all(
      documents.map((document) => {
        assertManagedDocumentName(document.name)
        return FileSystem.writeAsStringAsync(`${this.baseDirectory}${document.name}`, document.contentBase64, {
          encoding: FileSystem.EncodingType.Base64
        })
      })
    )
  }
}
