import { sqlite } from './client'

export async function runMigrations() {
  sqlite.execSync('PRAGMA foreign_keys = ON')
}
