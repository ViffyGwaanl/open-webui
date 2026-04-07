import migrations from '../../../drizzle-rag/migrations'
import { migrate } from 'drizzle-orm/expo-sqlite/migrator'

import { indexDb, sqlite } from './client'

export async function runIndexMigrations() {
  sqlite.execSync('PRAGMA foreign_keys = ON')
  await migrate(indexDb, migrations)
}
