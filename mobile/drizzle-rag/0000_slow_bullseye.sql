CREATE TABLE `document_chunks` (
	`id` text PRIMARY KEY NOT NULL,
	`document_id` text NOT NULL,
	`fts_row_id` integer,
	`start_offset` integer NOT NULL,
	`end_offset` integer NOT NULL,
	`page_number` integer,
	`section_title` text,
	`chunk_text` text NOT NULL,
	`token_estimate` integer,
	`embedding_blob` text,
	`embedding_dimension` integer,
	`embedding_model_id` text,
	`embedding_provider_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE VIRTUAL TABLE `document_chunks_fts` USING fts5(
	`document_id`,
	`chunk_text`,
	`section_title`
);
--> statement-breakpoint
CREATE TABLE `document_texts` (
	`id` text PRIMARY KEY NOT NULL,
	`document_id` text NOT NULL,
	`normalized_text` text NOT NULL,
	`outline_json` text DEFAULT '[]' NOT NULL,
	`page_map_json` text DEFAULT '[]' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`file_type` text NOT NULL,
	`storage_uri` text NOT NULL,
	`checksum` text NOT NULL,
	`file_size` integer,
	`page_count` integer,
	`text_length` integer,
	`import_status` text NOT NULL,
	`index_status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `index_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`document_id` text NOT NULL,
	`status` text NOT NULL,
	`attempt_count` integer DEFAULT 0 NOT NULL,
	`last_error_json` text DEFAULT '{}' NOT NULL,
	`last_progress_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
