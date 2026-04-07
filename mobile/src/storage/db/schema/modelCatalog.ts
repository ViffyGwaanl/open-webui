import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const modelCatalog = sqliteTable('model_catalog', {
  id: text('id').primaryKey(),
  providerProfileId: text('provider_profile_id').notNull(),
  modelId: text('model_id').notNull(),
  label: text('label').notNull(),
  capabilitiesJson: text('capabilities_json').notNull().default('[]'),
  supportsStreaming: integer('supports_streaming', { mode: 'boolean' }).notNull().default(true),
  supportsReasoning: integer('supports_reasoning', { mode: 'boolean' }).notNull().default(false),
  isEmbeddingModel: integer('is_embedding_model', { mode: 'boolean' }).notNull().default(false),
  updatedAt: integer('updated_at').notNull()
})
