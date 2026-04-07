import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const providerProfiles = sqliteTable('provider_profiles', {
  id: text('id').primaryKey(),
  presetType: text('preset_type').notNull(),
  displayName: text('display_name').notNull(),
  baseUrl: text('base_url').notNull(),
  apiKeyRef: text('api_key_ref').notNull(),
  extraHeadersJson: text('extra_headers_json').notNull().default('{}'),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull()
})
