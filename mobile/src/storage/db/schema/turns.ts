import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const turns = sqliteTable('turns', {
  id: text('id').primaryKey(),
  threadId: text('thread_id').notNull(),
  role: text('role').notNull(),
  providerProfileId: text('provider_profile_id'),
  modelId: text('model_id'),
  status: text('status').notNull(),
  contentJson: text('content_json').notNull().default('[]'),
  usageJson: text('usage_json').notNull().default('{}'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull()
})
