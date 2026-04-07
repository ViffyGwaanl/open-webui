CREATE TABLE `turn_retrieval_contexts` (
	`id` text PRIMARY KEY NOT NULL,
	`turn_id` text NOT NULL,
	`retrieval_mode` text DEFAULT 'rag' NOT NULL,
	`query_text` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `turn_retrieval_items` (
	`id` text PRIMARY KEY NOT NULL,
	`retrieval_context_id` text NOT NULL,
	`document_id` text NOT NULL,
	`source_label` text NOT NULL,
	`snippet_text` text NOT NULL,
	`page_number` integer,
	`section_title` text,
	`rank` integer NOT NULL,
	`included` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
