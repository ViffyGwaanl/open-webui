import { readFileSync } from 'node:fs'
import path from 'node:path'

describe('Expo SQLite migration manifests', () => {
  it.each(['drizzle/migrations.js', 'drizzle-rag/migrations.js'])(
    '%s inlines SQL strings instead of importing raw .sql assets',
    (manifestPath) => {
      const manifestSource = readFileSync(path.join(process.cwd(), manifestPath), 'utf8')

      expect(manifestSource).not.toMatch(/from ['"]\.\/.+\.sql['"]/)
    }
  )
})
