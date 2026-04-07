import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const comparePresets = sqliteTable('compare_presets', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  targetModelsJson: text('target_models_json').notNull(),
  judgeConfigJson: text('judge_config_json').notNull().default('{}'),
  sharedContextEnabled: integer('shared_context_enabled', { mode: 'boolean' })
    .notNull()
    .default(true),
  advancedParamsJson: text('advanced_params_json').notNull().default('{}'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull()
})
