import { sqlite } from './client'

export async function runIndexMigrations() {
  sqlite.execSync('PRAGMA foreign_keys = ON')
}
