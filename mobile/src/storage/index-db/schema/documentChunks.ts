import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const documentChunks = sqliteTable('document_chunks', {
  id: text('id').primaryKey(),
  documentId: text('document_id').notNull(),
  ftsRowId: integer('fts_row_id'),
  startOffset: integer('start_offset').notNull(),
  endOffset: integer('end_offset').notNull(),
  pageNumber: integer('page_number'),
  sectionTitle: text('section_title'),
  chunkText: text('chunk_text').notNull(),
  tokenEstimate: integer('token_estimate'),
  embeddingBlob: text('embedding_blob'),
  embeddingDimension: integer('embedding_dimension'),
  embeddingModelId: text('embedding_model_id'),
  embeddingProviderId: text('embedding_provider_id'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull()
})
