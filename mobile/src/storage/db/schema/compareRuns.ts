import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const compareRuns = sqliteTable('compare_runs', {
  id: text('id').primaryKey(),
  threadId: text('thread_id').notNull(),
  promptTurnId: text('prompt_turn_id').notNull(),
  status: text('status').notNull(),
  presetId: text('preset_id'),
  compareConfigJson: text('compare_config_json').notNull(),
  judgeConfigJson: text('judge_config_json').notNull().default('{}'),
  retrievalContextJson: text('retrieval_context_json').notNull().default('[]'),
  aggregateUsageJson: text('aggregate_usage_json').notNull().default('{}'),
  aggregateTimingJson: text('aggregate_timing_json').notNull().default('{}'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull()
})
