import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const turnRetrievalContexts = sqliteTable('turn_retrieval_contexts', {
  id: text('id').primaryKey(),
  turnId: text('turn_id').notNull(),
  retrievalMode: text('retrieval_mode').notNull().default('rag'),
  queryText: text('query_text').notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull()
})
