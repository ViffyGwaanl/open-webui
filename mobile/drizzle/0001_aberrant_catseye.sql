CREATE TABLE `compare_branches` (
	`id` text PRIMARY KEY NOT NULL,
	`compare_run_id` text NOT NULL,
	`branch_index` integer NOT NULL,
	`provider_profile_id` text NOT NULL,
	`model_id` text NOT NULL,
	`status` text NOT NULL,
	`content_json` text DEFAULT '[]' NOT NULL,
	`usage_json` text DEFAULT '{}' NOT NULL,
	`latency_ms` integer,
	`error_json` text DEFAULT '{}' NOT NULL,
	`attempt_count` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `compare_presets` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`target_models_json` text NOT NULL,
	`judge_config_json` text DEFAULT '{}' NOT NULL,
	`shared_context_enabled` integer DEFAULT true NOT NULL,
	`advanced_params_json` text DEFAULT '{}' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `compare_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`thread_id` text NOT NULL,
	`prompt_turn_id` text NOT NULL,
	`status` text NOT NULL,
	`preset_id` text,
	`compare_config_json` text NOT NULL,
	`judge_config_json` text DEFAULT '{}' NOT NULL,
	`retrieval_context_json` text DEFAULT '[]' NOT NULL,
	`aggregate_usage_json` text DEFAULT '{}' NOT NULL,
	`aggregate_timing_json` text DEFAULT '{}' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `judge_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`compare_run_id` text NOT NULL,
	`provider_profile_id` text NOT NULL,
	`model_id` text NOT NULL,
	`status` text NOT NULL,
	`content_json` text DEFAULT '[]' NOT NULL,
	`usage_json` text DEFAULT '{}' NOT NULL,
	`latency_ms` integer,
	`error_json` text DEFAULT '{}' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
