CREATE TABLE `app_preferences` (
	`key` text PRIMARY KEY NOT NULL,
	`value_json` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `model_catalog` (
	`id` text PRIMARY KEY NOT NULL,
	`provider_profile_id` text NOT NULL,
	`model_id` text NOT NULL,
	`label` text NOT NULL,
	`capabilities_json` text DEFAULT '[]' NOT NULL,
	`supports_streaming` integer DEFAULT true NOT NULL,
	`supports_reasoning` integer DEFAULT false NOT NULL,
	`is_embedding_model` integer DEFAULT false NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `provider_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`preset_type` text NOT NULL,
	`display_name` text NOT NULL,
	`base_url` text NOT NULL,
	`api_key_ref` text NOT NULL,
	`extra_headers_json` text DEFAULT '{}' NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `threads` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`source_thread_id` text,
	`source_branch_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `turns` (
	`id` text PRIMARY KEY NOT NULL,
	`thread_id` text NOT NULL,
	`role` text NOT NULL,
	`provider_profile_id` text,
	`model_id` text,
	`status` text NOT NULL,
	`content_json` text DEFAULT '[]' NOT NULL,
	`usage_json` text DEFAULT '{}' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
