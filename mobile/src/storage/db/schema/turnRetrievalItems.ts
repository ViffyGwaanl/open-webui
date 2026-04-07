import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const turnRetrievalItems = sqliteTable('turn_retrieval_items', {
  id: text('id').primaryKey(),
  retrievalContextId: text('retrieval_context_id').notNull(),
  documentId: text('document_id').notNull(),
  sourceLabel: text('source_label').notNull(),
  snippetText: text('snippet_text').notNull(),
  pageNumber: integer('page_number'),
  sectionTitle: text('section_title'),
  rank: integer('rank').notNull(),
  included: integer('included', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull()
})
