// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import journal from './meta/_journal.json'

const m0000 = `CREATE TABLE \`document_chunks\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`document_id\` text NOT NULL,
\t\`fts_row_id\` integer,
\t\`start_offset\` integer NOT NULL,
\t\`end_offset\` integer NOT NULL,
\t\`page_number\` integer,
\t\`section_title\` text,
\t\`chunk_text\` text NOT NULL,
\t\`token_estimate\` integer,
\t\`embedding_blob\` text,
\t\`embedding_dimension\` integer,
\t\`embedding_model_id\` text,
\t\`embedding_provider_id\` text,
\t\`created_at\` integer NOT NULL,
\t\`updated_at\` integer NOT NULL
);
--> statement-breakpoint
CREATE VIRTUAL TABLE \`document_chunks_fts\` USING fts5(
\t\`document_id\`,
\t\`chunk_text\`,
\t\`section_title\`
);
--> statement-breakpoint
CREATE TABLE \`document_texts\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`document_id\` text NOT NULL,
\t\`normalized_text\` text NOT NULL,
\t\`outline_json\` text DEFAULT '[]' NOT NULL,
\t\`page_map_json\` text DEFAULT '[]' NOT NULL,
\t\`created_at\` integer NOT NULL,
\t\`updated_at\` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE \`documents\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`display_name\` text NOT NULL,
\t\`file_type\` text NOT NULL,
\t\`storage_uri\` text NOT NULL,
\t\`checksum\` text NOT NULL,
\t\`file_size\` integer,
\t\`page_count\` integer,
\t\`text_length\` integer,
\t\`import_status\` text NOT NULL,
\t\`index_status\` text DEFAULT 'pending' NOT NULL,
\t\`created_at\` integer NOT NULL,
\t\`updated_at\` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE \`index_jobs\` (
\t\`id\` text PRIMARY KEY NOT NULL,
\t\`document_id\` text NOT NULL,
\t\`status\` text NOT NULL,
\t\`attempt_count\` integer DEFAULT 0 NOT NULL,
\t\`last_error_json\` text DEFAULT '{}' NOT NULL,
\t\`last_progress_at\` integer,
\t\`created_at\` integer NOT NULL,
\t\`updated_at\` integer NOT NULL
);`

export default {
  journal,
  migrations: {
    m0000
  }
}
