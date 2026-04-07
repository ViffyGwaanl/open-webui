import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const judgeRuns = sqliteTable('judge_runs', {
  id: text('id').primaryKey(),
  compareRunId: text('compare_run_id').notNull(),
  providerProfileId: text('provider_profile_id').notNull(),
  modelId: text('model_id').notNull(),
  status: text('status').notNull(),
  contentJson: text('content_json').notNull().default('[]'),
  usageJson: text('usage_json').notNull().default('{}'),
  latencyMs: integer('latency_ms'),
  errorJson: text('error_json').notNull().default('{}'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull()
})
