import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const documentChunksFts = sqliteTable('document_chunks_fts', {
  rowid: integer('rowid').primaryKey(),
  documentId: text('document_id').notNull(),
  chunkText: text('chunk_text').notNull(),
  sectionTitle: text('section_title')
})
