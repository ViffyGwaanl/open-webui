import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const threads = sqliteTable('threads', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  sourceThreadId: text('source_thread_id'),
  sourceBranchId: text('source_branch_id'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull()
})
