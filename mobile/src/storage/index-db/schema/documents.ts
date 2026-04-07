import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const documents = sqliteTable('documents', {
  id: text('id').primaryKey(),
  displayName: text('display_name').notNull(),
  fileType: text('file_type').notNull(),
  storageUri: text('storage_uri').notNull(),
  checksum: text('checksum').notNull(),
  fileSize: integer('file_size'),
  pageCount: integer('page_count'),
  textLength: integer('text_length'),
  importStatus: text('import_status').notNull(),
  indexStatus: text('index_status').notNull().default('pending'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull()
})
