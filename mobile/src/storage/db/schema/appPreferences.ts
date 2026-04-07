import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const appPreferences = sqliteTable('app_preferences', {
  key: text('key').primaryKey(),
  valueJson: text('value_json').notNull(),
  updatedAt: integer('updated_at').notNull()
})
