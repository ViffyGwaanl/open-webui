import { drizzle } from 'drizzle-orm/expo-sqlite'
import { openDatabaseSync } from 'expo-sqlite'

const sqlite = openDatabaseSync('openwebui-native.db')

export const db = drizzle(sqlite)
export { sqlite }
