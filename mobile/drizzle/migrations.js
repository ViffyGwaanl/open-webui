// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import journal from './meta/_journal.json';

const m0000 = `CREATE TABLE \`app_preferences\` (
\t\`key\` text PRIMARY KEY NOT NULL,
\t\`value_json\` text NOT NULL,
\t\`updated_at\` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE \`model_catalog\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`provider_profile_id\` text NOT NULL,
\t\`model_id\` text NOT NULL,
\t\`label\` text NOT NULL,
\t\`capabilities_json\` text DEFAULT '[]' NOT NULL,
\t\`supports_streaming\` integer DEFAULT true NOT NULL,
\t\`supports_reasoning\` integer DEFAULT false NOT NULL,
\t\`is_embedding_model\` integer DEFAULT false NOT NULL,
\t\`updated_at\` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE \`provider_profiles\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`preset_type\` text NOT NULL,
\t\`display_name\` text NOT NULL,
\t\`base_url\` text NOT NULL,
\t\`api_key_ref\` text NOT NULL,
\t\`extra_headers_json\` text DEFAULT '{}' NOT NULL,
\t\`enabled\` integer DEFAULT true NOT NULL,
\t\`created_at\` integer NOT NULL,
\t\`updated_at\` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE \`threads\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`title\` text NOT NULL,
\t\`source_thread_id\` text,
\t\`source_branch_id\` text,
\t\`created_at\` integer NOT NULL,
\t\`updated_at\` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE \`turns\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`thread_id\` text NOT NULL,
\t\`role\` text NOT NULL,
\t\`provider_profile_id\` text,
\t\`model_id\` text,
\t\`status\` text NOT NULL,
\t\`content_json\` text DEFAULT '[]' NOT NULL,
\t\`usage_json\` text DEFAULT '{}' NOT NULL,
\t\`created_at\` integer NOT NULL,
\t\`updated_at\` integer NOT NULL
);`;

const m0001 = `CREATE TABLE \`compare_branches\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`compare_run_id\` text NOT NULL,
\t\`branch_index\` integer NOT NULL,
\t\`provider_profile_id\` text NOT NULL,
\t\`model_id\` text NOT NULL,
\t\`status\` text NOT NULL,
\t\`content_json\` text DEFAULT '[]' NOT NULL,
\t\`usage_json\` text DEFAULT '{}' NOT NULL,
\t\`latency_ms\` integer,
\t\`error_json\` text DEFAULT '{}' NOT NULL,
\t\`attempt_count\` integer DEFAULT 1 NOT NULL,
\t\`created_at\` integer NOT NULL,
\t\`updated_at\` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE \`compare_presets\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`name\` text NOT NULL,
\t\`target_models_json\` text NOT NULL,
\t\`judge_config_json\` text DEFAULT '{}' NOT NULL,
\t\`shared_context_enabled\` integer DEFAULT true NOT NULL,
\t\`advanced_params_json\` text DEFAULT '{}' NOT NULL,
\t\`created_at\` integer NOT NULL,
\t\`updated_at\` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE \`compare_runs\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`thread_id\` text NOT NULL,
\t\`prompt_turn_id\` text NOT NULL,
\t\`status\` text NOT NULL,
\t\`preset_id\` text,
\t\`compare_config_json\` text NOT NULL,
\t\`judge_config_json\` text DEFAULT '{}' NOT NULL,
\t\`retrieval_context_json\` text DEFAULT '[]' NOT NULL,
\t\`aggregate_usage_json\` text DEFAULT '{}' NOT NULL,
\t\`aggregate_timing_json\` text DEFAULT '{}' NOT NULL,
\t\`created_at\` integer NOT NULL,
\t\`updated_at\` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE \`judge_runs\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`compare_run_id\` text NOT NULL,
\t\`provider_profile_id\` text NOT NULL,
\t\`model_id\` text NOT NULL,
\t\`status\` text NOT NULL,
\t\`content_json\` text DEFAULT '[]' NOT NULL,
\t\`usage_json\` text DEFAULT '{}' NOT NULL,
\t\`latency_ms\` integer,
\t\`error_json\` text DEFAULT '{}' NOT NULL,
\t\`created_at\` integer NOT NULL,
\t\`updated_at\` integer NOT NULL
);`;

const m0002 = `CREATE TABLE \`turn_retrieval_contexts\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`turn_id\` text NOT NULL,
\t\`retrieval_mode\` text DEFAULT 'rag' NOT NULL,
\t\`query_text\` text NOT NULL,
\t\`created_at\` integer NOT NULL,
\t\`updated_at\` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE \`turn_retrieval_items\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`retrieval_context_id\` text NOT NULL,
\t\`document_id\` text NOT NULL,
\t\`source_label\` text NOT NULL,
\t\`snippet_text\` text NOT NULL,
\t\`page_number\` integer,
\t\`section_title\` text,
\t\`rank\` integer NOT NULL,
\t\`included\` integer DEFAULT true NOT NULL,
\t\`created_at\` integer NOT NULL,
\t\`updated_at\` integer NOT NULL
);`;

const m0003 = `ALTER TABLE \`compare_branches\` ADD \`continuation_thread_id\` text;`;

export default {
  journal,
  migrations: {
    m0000,
    m0001,
    m0002,
    m0003
  }
}
