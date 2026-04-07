import migrations from '../../../drizzle/migrations'
import { migrate } from 'drizzle-orm/expo-sqlite/migrator'

import { db, sqlite } from './client'

export async function runMigrations() {
  sqlite.execSync('PRAGMA foreign_keys = ON')
  await migrate(db, migrations)
}
