import { existsSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'

function listFiles(rootDirectory: string): string[] {
  return readdirSync(rootDirectory).flatMap((entry) => {
    const absolutePath = path.join(rootDirectory, entry)
    const relativePath = path.relative(rootDirectory, absolutePath)

    if (statSync(absolutePath).isDirectory()) {
      return listFiles(absolutePath).map((nestedPath) => path.join(relativePath, nestedPath))
    }

    return [relativePath]
  })
}

describe('Expo Router source layout', () => {
  it('keeps non-route modules out of src/app so native bundling resolves app/ as the route root', () => {
    const sourceAppDirectory = path.join(process.cwd(), 'src/app')
    const sourceAppFiles = existsSync(sourceAppDirectory) ? listFiles(sourceAppDirectory) : []

    expect(sourceAppFiles).toEqual([])
  })
})
