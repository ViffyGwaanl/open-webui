# Native Local RAG Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add lightweight local RAG to `mobile/` with `txt` / `md` / `pdf` import, local indexing in a dedicated SQLite database, external embeddings, external generation, hybrid retrieval, shared compare retrieval context, and evidence-aware library UX.

**Architecture:** Keep RAG isolated from the main chat database by introducing a dedicated index database plus a document-import pipeline. Store raw import metadata, normalized text, chunk rows, FTS search rows, and indexing job state locally; use provider-backed embeddings on demand; and inject retrieval snippets into both single and compare turns through an explicit retrieval context object that can be reviewed or excluded before rerun.

**Tech Stack:** React Native, Expo Router, TypeScript, Expo SQLite, Drizzle ORM, Expo FileSystem, Expo Document Picker, Expo Modules for PDF extraction, React Native Testing Library, Jest Expo

---

## Scope Guard

This plan only covers Phase 3 `Local RAG`.

- Do implement local file import, text extraction for `txt` / `md` / `pdf`, chunking, embedding-backed indexing, hybrid retrieval, prompt injection, library screens, and evidence review.
- Do not add OCR, cloud sync, server-side vector stores, collaborative sharing, or backup/restore work from the release plan.
- Keep embedding-provider configuration separate from chat-provider configuration.
- Keep immutable turn evidence snapshots in the main workspace database so past answers retain their original source snippets even after later re-indexing.

## File Structure

### Dependencies and native PDF extraction

- Modify: `mobile/package.json`
- Create: `mobile/modules/pdf-text-extractor/module.config.json`
- Create: `mobile/modules/pdf-text-extractor/index.ts`
- Create: `mobile/modules/pdf-text-extractor/src/PdfTextExtractorModule.ts`
- Create: `mobile/modules/pdf-text-extractor/ios/PdfTextExtractorModule.swift`
- Create: `mobile/modules/pdf-text-extractor/android/src/main/java/expo/modules/pdftextextractor/PdfTextExtractorModule.kt`

### Dedicated local index database

- Modify: `mobile/src/storage/db/schema/providerProfiles.ts`
- Modify: `mobile/src/storage/db/schema/index.ts`
- Create: `mobile/src/storage/db/schema/turnRetrievalContexts.ts`
- Create: `mobile/src/storage/db/schema/turnRetrievalItems.ts`
- Create: `mobile/drizzle-rag.config.ts`
- Create: `mobile/drizzle-rag/0000_native_local_rag.sql`
- Create: `mobile/drizzle-rag/meta/_journal.json`
- Create: `mobile/drizzle-rag/meta/0000_snapshot.json`
- Create: `mobile/src/storage/index-db/client.ts`
- Create: `mobile/src/storage/index-db/migrate.ts`
- Create: `mobile/src/storage/index-db/schema/documents.ts`
- Create: `mobile/src/storage/index-db/schema/documentTexts.ts`
- Create: `mobile/src/storage/index-db/schema/documentChunks.ts`
- Create: `mobile/src/storage/index-db/schema/documentChunksFts.ts`
- Create: `mobile/src/storage/index-db/schema/indexJobs.ts`
- Create: `mobile/src/storage/index-db/schema/index.ts`
- Create: `mobile/src/storage/files/ImportedDocumentStore.ts`
- Test: `mobile/src/storage/index-db/schema/__tests__/indexSchema.test.ts`

### Import and indexing pipeline

- Create: `mobile/src/core/rag/types.ts`
- Create: `mobile/src/core/rag/import/extractText.ts`
- Create: `mobile/src/core/rag/import/txt.ts`
- Create: `mobile/src/core/rag/import/markdown.ts`
- Create: `mobile/src/core/rag/import/pdf.ts`
- Create: `mobile/src/core/rag/chunking/chunkDocument.ts`
- Create: `mobile/src/core/rag/embeddings/EmbeddingGateway.ts`
- Create: `mobile/src/core/rag/retrieval/retrieveContext.ts`
- Create: `mobile/src/core/rag/retrieval/mmr.ts`
- Create: `mobile/src/services/DocumentImportService.ts`
- Create: `mobile/src/services/DocumentIndexingService.ts`
- Create: `mobile/src/services/RetrievalService.ts`
- Create: `mobile/src/services/TurnEvidenceService.ts`
- Create: `mobile/src/services/RunSingleTurnWithRagService.ts`
- Test: `mobile/src/core/rag/chunking/__tests__/chunkDocument.test.ts`
- Test: `mobile/src/core/rag/retrieval/__tests__/retrieveContext.test.ts`
- Test: `mobile/src/services/__tests__/documentIndexingService.test.ts`

### UI and chat integration

- Modify: `mobile/src/app/AppProviders.tsx`
- Modify: `mobile/app/(tabs)/library/index.tsx`
- Modify: `mobile/src/features/chat/ChatScreen.tsx`
- Modify: `mobile/src/features/chat/MessageComposer.tsx`
- Create: `mobile/app/library/[documentId].tsx`
- Create: `mobile/src/features/library/LibraryScreen.tsx`
- Create: `mobile/src/features/library/DocumentList.tsx`
- Create: `mobile/src/features/library/DocumentRow.tsx`
- Create: `mobile/src/features/library/DocumentDetailScreen.tsx`
- Create: `mobile/src/features/library/DocumentImportButton.tsx`
- Create: `mobile/src/features/library/IndexJobBadge.tsx`
- Create: `mobile/src/features/chat/RagContextSheet.tsx`
- Create: `mobile/src/features/chat/RagEvidenceBadge.tsx`
- Test: `mobile/src/features/library/__tests__/LibraryScreen.test.tsx`
- Test: `mobile/src/features/chat/__tests__/ChatScreen.rag.test.tsx`

## Task 1: Add The Dedicated RAG Index Database And Import Metadata

**Files:**
- Create: `mobile/drizzle-index.config.ts`
- Create: `mobile/drizzle-index/0000_native_local_rag.sql`
- Create: `mobile/drizzle-index/meta/_journal.json`
- Create: `mobile/drizzle-index/meta/0000_snapshot.json`
- Create: `mobile/src/storage/indexDb/client.ts`
- Create: `mobile/src/storage/indexDb/migrate.ts`
- Create: `mobile/src/storage/indexDb/schema/documents.ts`
- Create: `mobile/src/storage/indexDb/schema/documentTexts.ts`
- Create: `mobile/src/storage/indexDb/schema/documentChunks.ts`
- Create: `mobile/src/storage/indexDb/schema/documentChunksFts.ts`
- Create: `mobile/src/storage/indexDb/schema/indexJobs.ts`
- Create: `mobile/src/storage/indexDb/schema/index.ts`
- Test: `mobile/src/storage/indexDb/schema/__tests__/indexSchema.test.ts`

- [ ] **Step 1: Write the failing index-schema test**

```ts
// mobile/src/storage/indexDb/schema/__tests__/indexSchema.test.ts
import {
  documentChunks,
  documentChunksFts,
  documents,
  documentTexts,
  indexJobs
} from '../index'

describe('local rag index schema', () => {
  it('exports the document and indexing tables', () => {
    expect(documents.importStatus).toBeDefined()
    expect(documentTexts.normalizedText).toBeDefined()
    expect(documentChunks.embeddingBlob).toBeDefined()
    expect(documentChunksFts.rowid).toBeDefined()
    expect(indexJobs.status).toBeDefined()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
cd /Users/gwaanl/.config/superpowers/worktrees/open-webui/native-platform-core/mobile
npx -p node@22 -p npm@10 npm test -- --runTestsByPath src/storage/indexDb/schema/__tests__/indexSchema.test.ts --runInBand
```

Expected: FAIL because the dedicated RAG index schema does not exist.

- [ ] **Step 3: Create the RAG index schema and migration**

```ts
// mobile/src/storage/indexDb/schema/documents.ts
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const documents = sqliteTable('documents', {
  id: text('id').primaryKey(),
  displayName: text('display_name').notNull(),
  fileType: text('file_type').notNull(),
  storageUri: text('storage_uri').notNull(),
  checksum: text('checksum').notNull(),
  pageCount: integer('page_count'),
  textLength: integer('text_length'),
  importStatus: text('import_status').notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull()
})
```

```sql
-- mobile/drizzle-index/0000_native_local_rag.sql
CREATE TABLE `documents` (
  `id` text PRIMARY KEY NOT NULL,
  `display_name` text NOT NULL,
  `file_type` text NOT NULL,
  `storage_uri` text NOT NULL,
  `checksum` text NOT NULL,
  `page_count` integer,
  `text_length` integer,
  `import_status` text NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);

CREATE VIRTUAL TABLE `document_chunks_fts` USING fts5(chunk_text, section_title, content='document_chunks', content_rowid='fts_rowid');
```

- [ ] **Step 4: Add the index database client and generate metadata**

Run:

```bash
cd /Users/gwaanl/.config/superpowers/worktrees/open-webui/native-platform-core/mobile
npx -p node@22 -p npm@10 npm run db:generate -- --config=drizzle-index.config.ts
```

Expected: the RAG snapshot metadata is created without touching the main chat database migration set.

- [ ] **Step 5: Run the index-schema test and commit**

Run:

```bash
cd /Users/gwaanl/.config/superpowers/worktrees/open-webui/native-platform-core/mobile
npx -p node@22 -p npm@10 npm test -- --runTestsByPath src/storage/indexDb/schema/__tests__/indexSchema.test.ts --runInBand
git add drizzle-index* src/storage/indexDb
git commit -m "feat: add native rag index database"
```

Expected: PASS with a dedicated RAG database boundary in place.

## Task 2: Implement File Import And Text Extraction For TXT, MD, And PDF

**Files:**
- Modify: `mobile/package.json`
- Create: `mobile/modules/pdf-text-extractor/module.config.json`
- Create: `mobile/modules/pdf-text-extractor/index.ts`
- Create: `mobile/modules/pdf-text-extractor/src/PdfTextExtractorModule.ts`
- Create: `mobile/modules/pdf-text-extractor/ios/PdfTextExtractorModule.swift`
- Create: `mobile/modules/pdf-text-extractor/android/src/main/java/expo/modules/pdftextextractor/PdfTextExtractorModule.kt`
- Create: `mobile/src/core/rag/textExtraction.ts`
- Create: `mobile/src/services/DocumentImportService.ts`
- Test: `mobile/src/services/__tests__/documentIndexingService.test.ts`

- [ ] **Step 1: Write the failing import test**

```ts
// mobile/src/services/__tests__/documentIndexingService.test.ts
import { DocumentImportService } from '../DocumentImportService'

describe('DocumentImportService', () => {
  it('imports markdown with heading-aware normalized text', async () => {
    const service = new DocumentImportService(/* doubles */ {} as never)

    await expect(
      service.importDocument({
        uri: 'file:///tmp/guide.md',
        name: 'guide.md',
        mimeType: 'text/markdown'
      })
    ).resolves.toMatchObject({
      fileType: 'md',
      importStatus: 'imported'
    })
  })
})
```

- [ ] **Step 2: Run the import test to verify it fails**

Run:

```bash
cd /Users/gwaanl/.config/superpowers/worktrees/open-webui/native-platform-core/mobile
npx -p node@22 -p npm@10 npm test -- --runTestsByPath src/services/__tests__/documentIndexingService.test.ts --runInBand
```

Expected: FAIL because document import and extraction services do not exist.

- [ ] **Step 3: Add text extraction strategies and PDF native module**

```ts
// mobile/src/core/rag/textExtraction.ts
export async function extractDocumentText(input: ImportableDocument): Promise<ExtractedDocumentText> {
  if (input.fileType === 'txt') {
    return { plainText: normalizeText(await readAsStringAsync(input.uri)), outline: [], pages: [] }
  }

  if (input.fileType === 'md') {
    return extractMarkdownText(await readAsStringAsync(input.uri))
  }

  return extractPdfText(input.uri)
}
```

```swift
// mobile/modules/pdf-text-extractor/ios/PdfTextExtractorModule.swift
import ExpoModulesCore
import PDFKit

public class PdfTextExtractorModule: Module {
  public func definition() -> ModuleDefinition {
    Name("PdfTextExtractor")
    AsyncFunction("extract") { (uri: String) -> [String: Any] in
      let document = PDFDocument(url: URL(string: uri)!)
      let pages = (0..<(document?.pageCount ?? 0)).compactMap { index -> [String: Any]? in
        guard let page = document?.page(at: index) else { return nil }
        return ["page": index + 1, "text": page.string ?? ""]
      }
      return ["pages": pages]
    }
  }
}
```

- [ ] **Step 4: Persist imported file metadata into the RAG index**

```ts
// mobile/src/services/DocumentImportService.ts
export class DocumentImportService {
  constructor(private readonly deps: DocumentImportDeps) {}

  async importDocument(input: PickedDocument) {
    const storedFile = await this.deps.storage.copyIntoManagedDirectory(input)
    const extracted = await this.deps.extractor.extract(storedFile)
    return this.deps.repository.insertImportedDocument(storedFile, extracted)
  }
}
```

- [ ] **Step 5: Re-run the import test and commit**

Run:

```bash
cd /Users/gwaanl/.config/superpowers/worktrees/open-webui/native-platform-core/mobile
npx -p node@22 -p npm@10 npm test -- --runTestsByPath src/services/__tests__/documentIndexingService.test.ts --runInBand
git add package.json modules src/core/rag src/services
git commit -m "feat: add local rag file import and extraction"
```

Expected: PASS with `txt`, `md`, and `pdf` import paths represented in the codebase.

## Task 3: Implement Chunking, Embedding, And Hybrid Retrieval

**Files:**
- Create: `mobile/src/core/rag/types.ts`
- Create: `mobile/src/core/rag/chunking.ts`
- Create: `mobile/src/core/rag/retrieval.ts`
- Create: `mobile/src/core/rag/mmr.ts`
- Create: `mobile/src/services/DocumentIndexingService.ts`
- Create: `mobile/src/services/RetrievalService.ts`
- Create: `mobile/src/services/EmbeddingProfileService.ts`
- Test: `mobile/src/core/rag/__tests__/chunking.test.ts`
- Test: `mobile/src/core/rag/__tests__/retrieval.test.ts`
- Test: `mobile/src/services/__tests__/documentIndexingService.test.ts`

- [ ] **Step 1: Write failing chunking and retrieval tests**

```ts
// mobile/src/core/rag/__tests__/chunking.test.ts
import { chunkDocumentText } from '../chunking'

describe('chunkDocumentText', () => {
  it('prefers heading and paragraph boundaries before sliding windows', () => {
    const chunks = chunkDocumentText({
      plainText: '# Intro\n\nOne paragraph.\n\n## Deep Dive\n\nA much longer section here.'
    })

    expect(chunks[0].sectionTitle).toBe('Intro')
    expect(chunks.every((chunk) => chunk.text.length <= 1400)).toBe(true)
  })
})
```

```ts
// mobile/src/core/rag/__tests__/retrieval.test.ts
import { assembleRetrievalContext } from '../retrieval'

describe('assembleRetrievalContext', () => {
  it('combines keyword candidates with vector reranking and mmr deduplication', async () => {
    const result = await assembleRetrievalContext({
      query: 'What changed in the architecture?',
      topK: 4,
      candidateRows: [/* fixture rows */]
    })

    expect(result.snippets.length).toBeLessThanOrEqual(4)
    expect(result.snippets[0].documentId).toBeDefined()
  })
})
```

- [ ] **Step 2: Run the targeted tests to verify they fail**

Run:

```bash
cd /Users/gwaanl/.config/superpowers/worktrees/open-webui/native-platform-core/mobile
npx -p node@22 -p npm@10 npm test -- --runTestsByPath src/core/rag/__tests__/chunking.test.ts src/core/rag/__tests__/retrieval.test.ts src/services/__tests__/documentIndexingService.test.ts --runInBand
```

Expected: FAIL because chunking and retrieval logic do not exist.

- [ ] **Step 3: Implement structure-aware chunking and external embedding**

```ts
// mobile/src/core/rag/chunking.ts
const DEFAULT_CHUNKING = {
  targetChars: 900,
  maxChars: 1400,
  minChars: 220,
  overlapChars: 120
}

export function chunkDocumentText(input: ChunkingInput): DocumentChunkDraft[] {
  return splitByHeadingsAndParagraphs(input.plainText, DEFAULT_CHUNKING)
}
```

```ts
// mobile/src/services/DocumentIndexingService.ts
export class DocumentIndexingService {
  async indexDocument(documentId: string) {
    const document = await this.deps.repository.loadDocument(documentId)
    const chunks = chunkDocumentText(document.extractedText)
    const embedded = await this.deps.embeddingClient.embedBatch({
      modelId: document.embeddingModelId,
      texts: chunks.map((chunk) => chunk.text)
    })
    await this.deps.repository.storeChunks(documentId, chunks, embedded)
  }
}
```

- [ ] **Step 4: Implement retrieval assembly with FTS, vector reranking, and MMR**

```ts
// mobile/src/core/rag/retrieval.ts
export async function assembleRetrievalContext(args: RetrievalArgs): Promise<RetrievalContext> {
  const keywordCandidates = await args.repository.searchKeywordCandidates(args.query)
  const queryEmbedding = await args.embedQuery(args.query)
  const reranked = rerankByCosineSimilarity(keywordCandidates, queryEmbedding)
  const snippets = applyMaximalMarginalRelevance(reranked, args.topK)
  return { snippets, matchedDocumentIds: [...new Set(snippets.map((snippet) => snippet.documentId))] }
}
```

- [ ] **Step 5: Run the targeted tests and commit**

Run:

```bash
cd /Users/gwaanl/.config/superpowers/worktrees/open-webui/native-platform-core/mobile
npx -p node@22 -p npm@10 npm test -- --runTestsByPath src/core/rag/__tests__/chunking.test.ts src/core/rag/__tests__/retrieval.test.ts src/services/__tests__/documentIndexingService.test.ts --runInBand
git add src/core/rag src/services
git commit -m "feat: add local rag indexing and retrieval core"
```

Expected: PASS with chunking and hybrid retrieval covered.

## Task 4: Integrate RAG Into Chat, Compare, And Library UX

**Files:**
- Modify: `mobile/app/(tabs)/library/index.tsx`
- Modify: `mobile/src/features/chat/ChatScreen.tsx`
- Modify: `mobile/src/features/chat/MessageComposer.tsx`
- Create: `mobile/app/library/[documentId].tsx`
- Create: `mobile/src/features/library/LibraryScreen.tsx`
- Create: `mobile/src/features/library/DocumentList.tsx`
- Create: `mobile/src/features/library/DocumentDetailScreen.tsx`
- Create: `mobile/src/features/library/ImportDocumentButton.tsx`
- Create: `mobile/src/features/chat/RagContextSheet.tsx`
- Create: `mobile/src/features/chat/RagEvidenceBadge.tsx`
- Test: `mobile/src/features/library/__tests__/LibraryScreen.test.tsx`
- Test: `mobile/src/features/chat/__tests__/ChatScreen.rag.test.tsx`

- [ ] **Step 1: Write the failing RAG UI tests**

```tsx
// mobile/src/features/chat/__tests__/ChatScreen.rag.test.tsx
import { fireEvent, render, screen } from '@testing-library/react-native'
import { ChatScreen } from '../ChatScreen'

describe('ChatScreen rag mode', () => {
  it('shows retrieval evidence after a rag-enabled send', async () => {
    render(
      <ChatScreen
        threadId="thread-1"
        runSingleTurn={async () => {}}
        runCompareTurn={async () => {}}
        runRagTurn={async () => ({
          snippets: [{ id: 'snippet-1', documentTitle: 'guide.pdf', text: 'Important section' }]
        })}
      />
    )

    fireEvent.press(screen.getByText('RAG'))
    fireEvent.changeText(screen.getByPlaceholderText('Ask anything'), 'Summarize the guide')
    fireEvent.press(screen.getByText('Send'))

    expect(await screen.findByText('guide.pdf')).toBeTruthy()
  })
})
```

```tsx
// mobile/src/features/library/__tests__/LibraryScreen.test.tsx
import { fireEvent, render, screen } from '@testing-library/react-native'
import { LibraryScreen } from '../LibraryScreen'

describe('LibraryScreen', () => {
  it('starts a document import and shows indexing status', async () => {
    const onImport = jest.fn().mockResolvedValue(undefined)

    render(<LibraryScreen documents={[{ id: 'doc-1', displayName: 'guide.pdf', importStatus: 'indexed' }]} onImport={onImport} />)

    fireEvent.press(screen.getByText('Import Document'))

    expect(onImport).toHaveBeenCalled()
    expect(screen.getByText('guide.pdf')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run the RAG UI tests to verify they fail**

Run:

```bash
cd /Users/gwaanl/.config/superpowers/worktrees/open-webui/native-platform-core/mobile
npx -p node@22 -p npm@10 npm test -- --runTestsByPath src/features/library/__tests__/LibraryScreen.test.tsx src/features/chat/__tests__/ChatScreen.rag.test.tsx --runInBand
```

Expected: FAIL because the library and RAG evidence surfaces do not exist.

- [ ] **Step 3: Add library import, document detail, and indexing status surfaces**

```tsx
// mobile/src/features/library/LibraryScreen.tsx
export function LibraryScreen({ documents, onImport }: LibraryScreenProps) {
  return (
    <View style={styles.container}>
      <ImportDocumentButton onPress={onImport} />
      <DocumentList documents={documents} />
    </View>
  )
}
```

```tsx
// mobile/src/features/chat/RagContextSheet.tsx
export function RagContextSheet({ snippets, onExclude }: Props) {
  return (
    <BottomSheet>
      {snippets.map((snippet) => (
        <Pressable key={snippet.id} onPress={() => onExclude(snippet.id)}>
          <Text>{snippet.documentTitle}</Text>
          <Text>{snippet.text}</Text>
        </Pressable>
      ))}
    </BottomSheet>
  )
}
```

- [ ] **Step 4: Inject shared retrieval context into single and compare sends**

```ts
// mobile/src/features/chat/ChatScreen.tsx
if (composerMode === 'compare') {
  await runCompareTurn({ threadId, prompt, retrievalContext: selectedRagContext })
} else if (composerMode === 'rag') {
  const context = await runRagTurn({ threadId, prompt })
  setLatestRagContext(context)
}
```

- [ ] **Step 5: Run the full mobile suite, then commit**

Run:

```bash
cd /Users/gwaanl/.config/superpowers/worktrees/open-webui/native-platform-core/mobile
npx -p node@22 -p npm@10 npm test -- --runInBand
npx -p node@22 -p npm@10 npm run typecheck
git add app src
git commit -m "feat: integrate local rag into mobile workspace"
```

Expected: PASS with document import, retrieval evidence, and shared compare retrieval context wired into the app.
