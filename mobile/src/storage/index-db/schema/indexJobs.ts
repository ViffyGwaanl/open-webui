import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const indexJobs = sqliteTable('index_jobs', {
  id: text('id').primaryKey(),
  documentId: text('document_id').notNull(),
  status: text('status').notNull(),
  attemptCount: integer('attempt_count').notNull().default(0),
  lastErrorJson: text('last_error_json').notNull().default('{}'),
  lastProgressAt: integer('last_progress_at'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull()
})
