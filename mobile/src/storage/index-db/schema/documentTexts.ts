import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const documentTexts = sqliteTable('document_texts', {
  id: text('id').primaryKey(),
  documentId: text('document_id').notNull(),
  normalizedText: text('normalized_text').notNull(),
  outlineJson: text('outline_json').notNull().default('[]'),
  pageMapJson: text('page_map_json').notNull().default('[]'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull()
})
