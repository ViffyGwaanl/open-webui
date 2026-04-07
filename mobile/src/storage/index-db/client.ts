import { drizzle } from 'drizzle-orm/expo-sqlite'
import { openDatabaseSync } from 'expo-sqlite'

const sqlite = openDatabaseSync('openwebui-native-rag.db')

export const indexDb = drizzle(sqlite)
export { sqlite }
