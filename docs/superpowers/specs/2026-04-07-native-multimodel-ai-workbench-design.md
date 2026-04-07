# 2026-04-07 Native Multimodel AI Workbench Design

## Status

Approved in conversational design review. Ready for implementation planning after user review of this document.

## Context

This design answers whether the current `open-webui` project can be turned into a standalone native mobile app for Apple and Android platforms that:

- does not require a self-hosted backend
- uses user-supplied `API key + base URL`
- supports `OpenAI`, `Gemini`, and `Claude`
- supports lightweight local RAG for `txt`, `md`, and `pdf`
- removes channels and multiplayer collaboration
- treats multi-model comparison as a primary capability

The conclusion from repo analysis is that `open-webui` should not be directly transformed into the target product. It should be used as a product and interaction reference only. The target product should be implemented as a new native/mobile client.

## Decision Summary

The product will be a new `React Native + Expo` native client, built as a release-grade `v1.0` product rather than a minimal prototype.

Primary product identity:

- native AI workbench
- local-first single-user client
- multimodel comparison as a first-class mode
- local document ingestion and lightweight local RAG
- no self-hosted backend requirement

Platform stance:

- one shared cross-platform codebase
- architecture must remain portable to iOS, iPadOS, and Android
- release-quality sign-off for v1.0 is required on iPhone, iPad, and Android
- Apple and Android are both launch platforms
- cross-platform reuse is required, but launch quality on any one platform must not be achieved by lowering the quality bar on the others

Primary architectural decisions:

- do not port `open-webui` frontend or backend directly
- use three native provider adapters: `OpenAI`, `Gemini`, `Claude`
- separate chat-generation providers from embedding providers
- use local persistence for all core product state
- use a unified internal conversation model for both single-model and compare-mode turns
- use shared retrieval context by default in compare mode for fair cross-model comparison

## Why Not Reuse Open WebUI Directly

`open-webui` is a browser-first plus server-first system. Its frontend assumes SvelteKit/browser runtime behavior, and its backend centralizes routing, files, retrieval, sockets, channels, auth, tools, and terminal functions in FastAPI. That is the wrong foundation for a standalone native client.

The direct-connections feature in `open-webui` is also not a full native provider layer. It is mainly an OpenAI-compatible direct path and still coexists with a server-oriented architecture.

Design implication:

- `open-webui` remains a product reference
- implementation starts as a clean native client

## Reference Project Synthesis

### Cherry Studio

Most useful ideas:

- strong split between provider config and model metadata
- provider registry and normalization
- centralized API host normalization
- normalized model listing strategy

Not suitable as base:

- Electron main/preload/renderer split
- IPC-heavy desktop runtime
- desktop knowledge/RAG and local API server coupling

### Cherry Studio App

Most useful ideas:

- `Expo React Native + SQLite + Drizzle`
- SQLite-backed preference service
- provider service plus normalized request builder
- typed streaming events
- native PDF text extraction on iOS and Android

Not suitable to copy as-is:

- very broad provider matrix
- MCP and streamable transport features
- dual modern and legacy AI execution paths
- partially scaffolded, not production-complete local knowledge/RAG path

### PaperTok Reader

Most useful ideas:

- lightweight local RAG DB shape
- character and boundary-aware chunking
- external embeddings with local index
- hybrid retrieval: FTS or LIKE candidates plus vector rerank plus MMR
- explicit separation of generation provider from embedding provider

Not suitable to copy as-is:

- EPUB and reader-bridge heavy architecture
- queue and tool systems built for a reading product
- much broader product scope than this app needs

## Product Goals

- ship a standalone native client that works without deploying a user-owned server
- keep the implementation architecture cross-platform rather than Apple-only
- support high-quality single-model chat and multimodel comparison
- benchmark feature-detail quality against the mobile-feasible subset of `open-webui`
- let users configure official or custom endpoints for OpenAI, Gemini, and Claude
- support local import, indexing, and retrieval for `txt`, `md`, and `pdf`
- persist all conversations, compare runs, documents, indexes, and settings locally
- deliver release-grade iPhone, iPad, and Android experiences

## Feature Detail Benchmark Principle

The target product should match `open-webui` in feature detail wherever those behaviors remain coherent on a native mobile client.

This means the product should intentionally benchmark against `open-webui` for mobile-feasible interaction details such as:

- model selection and fast model switching
- compare-mode orchestration and response inspection
- regeneration, retry, copy, export, and continuation actions
- per-turn RAG usage and evidence inspection
- attachment handling and file-aware chat flows
- reasoning or thinking display when providers expose it
- citations or source rendering when available
- chat-history navigation, search, pinning, and thread organization where mobile UX remains practical
- provider and per-model settings that materially affect chat behavior

This does not mean literal desktop or server feature parity.

Explicit exclusions from the benchmark principle:

- server-centric administration
- group and channel features
- desktop-only file system affordances
- terminal and tool-server integrations
- interaction patterns that depend on large-screen desktop assumptions and degrade the mobile experience

## Non-Goals

- channels
- multiplayer collaboration
- cloud sync
- self-hosted backend requirement
- MCP and tool ecosystems in v1.0
- OCR in v1.0
- remote shared knowledge bases
- branch merge-back into parent threads

## Product Scope for v1.0

Included:

- single-model chat
- compare mode
- optional judge summary
- branch continuation from any compared answer
- mobile-feasible `open-webui` detail parity for core chat and compare interactions
- local file import for `txt`, `md`, `pdf`
- lightweight local RAG
- conversation export
- provider configuration center
- metrics and error surfacing for requests
- local backup and restore foundations

Excluded:

- group features
- collaborative editing
- built-in external tool execution
- remote sync
- OCR and scanned-PDF understanding
- server-side retrieval

## Architecture Overview

The product consists of six major layers:

1. `App Shell`
   Navigation, layout, theme, device adaptation, thread list, compare workspace, library, and settings.
2. `Domain Layer`
   Canonical models for threads, turns, compare runs, branch responses, judge runs, documents, and retrieval contexts.
3. `Provider Layer`
   Native adapters for OpenAI, Gemini, and Claude.
4. `Chat Orchestration Layer`
   Single-model execution, compare execution, judge execution, cancellation, retry, and persistence updates.
5. `RAG Layer`
   File intake, text extraction, chunking, embeddings, indexing, retrieval, and prompt injection.
6. `Persistence Layer`
   SQLite-backed domain data, secure secret storage, durable file storage, export and migration support.

## Core Domain Model

### Workspace

Single-user local workspace containing:

- provider profiles
- model metadata cache
- threads
- compare presets
- imported documents
- local RAG index

### Thread

A long-lived conversation container. A thread may contain both normal single-model turns and multimodel compare turns.

### Turn

A single user input event. A turn can execute as:

- single-model run
- compare run

### CompareRun

A compare run represents one user input executed against multiple models in parallel. It stores:

- selected models
- shared retrieval context
- run state
- per-branch execution state
- aggregate timing and usage
- judge configuration

### BranchResponse

One model-specific result inside a compare run. Each branch stores:

- provider profile
- model id
- streaming state
- raw answer
- usage
- latency
- error state
- continuation lineage

### JudgeRun

Optional model-generated comparison summary across completed branches. It does not replace original responses.

### RetrievalContext

The set of snippets, document references, and metadata injected into a turn. In compare mode, one shared retrieval context is the default.

## Multimodel Interaction Model

The product adopts `branchable compare workspace` as the primary compare mode.

Capabilities:

- parallel execution across multiple models
- optional judge summary after branch completion
- ability to continue a conversation from any branch
- preservation of the original compare run as a stable artifact

Continuation rules:

- user chooses `Continue` on a branch
- system creates a child thread
- child thread inherits parent thread history up to the source compare turn plus the chosen branch response
- sibling branches are not inherited
- original compare turn remains unchanged

This avoids ambiguous context mixing and creates deterministic branch lineage.

## UI and Navigation Design

### Main Information Architecture

- `Threads`
- `Library`
- `Settings`

### Thread Screen

The thread screen is the main work surface.

A thread can display:

- standard single-model responses
- compare-run cards
- child-thread lineage breadcrumbs

### Composer Modes

The composer supports mode controls:

- `Single`
- `Compare`
- `RAG`
- `Judge`

Compare mode expands to:

- target model selection
- compare preset selection
- shared retrieval context toggle
- judge toggle
- judge model selection
- advanced parameters

### Compare Presentation

Default presentation strategy:

- phone: top tabs plus one visible branch at a time
- tablet: multi-column comparison
- all devices: optional stacked branch view

### Compare Card Contents

- compare run header
- judge summary section
- branch selector or columns
- branch status, model, provider, timing, and usage
- branch actions: continue, retry, copy, export, favorite

### Shared Context Presentation

RAG-enabled turns expose a drawer or sheet showing:

- matched files
- matched snippets
- source page or section
- injected context count
- ability to exclude snippets and rerun

## Provider Architecture

### ProviderPreset

Built-in first-party presets:

- `OpenAI`
- `Gemini`
- `Claude`

Each preset contains:

- official default base URL
- docs links
- model discovery rules
- auth header rules
- endpoint semantics

### ProviderProfile

User-managed provider configuration containing:

- `id`
- `presetType`
- `displayName`
- `baseUrl`
- `apiKeyRef`
- `extraHeaders`
- `enabled`
- `defaultChatRole`
- `defaultEmbeddingRole`
- timestamps

### ModelDescriptor

Canonical model metadata containing:

- provider profile reference
- model id and label
- capabilities
- context limits
- streaming support
- reasoning support
- tool support
- JSON mode support
- embedding flag

### Provider Adapters

Three native adapters only:

- `OpenAIAdapter`
- `GeminiAdapter`
- `ClaudeAdapter`

Rules:

- use native OpenAI request semantics
- use native Gemini request semantics
- use native Anthropic request semantics
- allow compatibility mode only when the user explicitly configures a compatible gateway

### Canonical Internal Types

- `CanonicalMessage`
- `CanonicalToolCall`
- `CanonicalUsage`
- `CanonicalStreamEvent`
- `CanonicalProviderError`

The UI and orchestration layers operate only on canonical internal types.

## Model Discovery Strategy

- `OpenAI`: dynamic model discovery via OpenAI-style listing
- `Gemini`: Gemini-native model listing
- `Claude`: curated static catalog plus optional manual model-id entry

All model results normalize into one `ModelDescriptor` shape.

## Secret Storage Strategy

Provider metadata may live in SQLite. Secrets do not.

Rules:

- SQLite stores `apiKeyRef`
- secure system storage stores actual keys
- exports omit secrets by default
- logs never include secrets

## RAG Architecture

### Supported File Types

- `txt`
- `md`
- `pdf`

### Explicit RAG Boundaries

- local indexing only
- local retrieval only
- external embeddings
- external generation
- no OCR in v1.0

### File Storage Strategy

Imported source files live in a durable application-managed directory, not cache.

### RAG Database Strategy

Use a dedicated local index database rather than mixing index internals into the main chat DB.

### Recommended Tables

`documents`

- source metadata
- storage metadata
- file type
- checksum
- page count
- text length
- import status

`document_texts`

- normalized extracted text
- optional outline data

`document_chunks`

- chunk identity
- document reference
- offsets
- section title
- chunk text
- token estimate
- embedding blob
- embedding dimension
- embedding model id
- embedding provider reference

`document_chunks_fts`

- SQLite FTS virtual table for keyword retrieval

`index_jobs`

- document indexing task tracking

### Text Extraction

- `txt`: direct text read plus encoding normalization
- `md`: preserve heading structure and derive normalized plain text
- `pdf`: native text extraction, preserve page metadata when available
- no OCR fallback in v1.0

### Chunking

Use lightweight structure-aware chunking:

- prefer headings and paragraph boundaries
- otherwise prefer natural boundaries near target length
- otherwise fall back to sliding windows

Default parameters:

- `targetChars = 900`
- `maxChars = 1400`
- `minChars = 220`
- `overlapChars = 120`

### Embeddings

Embeddings are external and independently configurable from generation.

Rules:

- chat provider and embedding provider are separate concepts
- embedding model selection is explicit
- embedding failures do not block normal chat

### Retrieval

Default retrieval pipeline:

1. FTS or LIKE candidate generation
2. query embedding
3. vector reranking
4. MMR deduplication
5. top-k snippet assembly
6. prompt injection

In compare mode, all branches share one retrieval context by default.

## Error Handling and Recovery

### Provider Errors

Errors must be normalized and surfaced as actionable categories:

- auth
- quota
- timeout
- model unavailable
- malformed endpoint
- unsupported capability
- transient network

### Compare Failure Behavior

- one failing branch does not fail the entire compare run
- branch-level retry is allowed
- compare-run-level rerun is allowed
- judge may run over partial successful branches

### Persistence Recovery

On restart:

- incomplete compare runs resolve into a stable recoverable state
- indexing jobs recover into safe resumable or failed states
- thread lineage remains intact

## Quality Targets

### Functional Quality

- compare mode is a first-class stable feature
- branch continuation is production-supported
- local RAG works across all supported file types

### Reliability

- no full-run failure from a single branch failure
- no broken lineage after crash or kill
- no corrupted index metadata after interrupted jobs

### Performance

- smooth UI during 4-way streaming compare runs
- large thread and message history remain navigable
- indexing does not freeze the foreground experience

### Product Completeness

- iPhone, iPad, and Android are all intentional launch targets
- provider configuration is understandable for non-expert users
- compare mode is usable on phone, not just tablet
- mobile-feasible `open-webui` interaction details are present in the core chat, compare, attachment, and evidence flows

## Testing Strategy

### Unit Tests

Cover:

- provider payload transforms
- capability gating
- compare state machine
- chunking
- retrieval ranking and MMR
- lineage construction
- error normalization

### Integration Tests

Cover:

- compose to compare-run persistence
- RAG retrieval to prompt injection
- branch continuation to child-thread creation
- secure key lookup
- file import to extract to chunk to embed to index

### UI Tests

Cover:

- single send
- compare send
- branch switching
- judge rendering
- branch continuation
- file import
- RAG evidence review
- error handling flows

### Manual Release QA

Required device coverage:

- small iPhone
- large iPhone
- iPad portrait
- iPad landscape
- representative small Android phone
- representative large Android phone
- representative Android tablet, if tablet support is included in the launch binary

Required scenarios:

- first-run provider setup
- single-model chat
- three-model compare
- compare plus judge
- compare plus RAG
- branch continuation
- PDF import and indexing
- kill and relaunch recovery
- offline and timeout handling

## Security and Privacy Requirements

- API keys never stored in plain SQLite
- exports omit secrets by default
- logs omit secrets and raw sensitive payloads
- imported files remain local unless explicitly used for embeddings or generation
- user-facing documentation must explain that indexed snippets may be sent to external model providers when RAG is enabled

## App Review and Distribution Constraints

App Review cannot assume that the reviewer has their own AI provider key.

Release planning must include one of:

- a review-safe demo provider path
- or explicit reviewer setup notes and test credentials

This is a release blocker, not a post-launch issue.

## Delivery Phases

This is not an MVP decomposition. It is a release-grade build order.

### Phase 1: Platform Core

- app shell
- local DBs
- secure storage
- provider center
- single-model chat
- canonical stream events
- thread persistence

### Phase 2: Compare Core

- compare run orchestration
- branch responses
- judge runs
- compare UI
- branch continuation
- compare presets
- export

### Phase 3: Local RAG

- file import
- text extraction
- chunking
- embedding pipeline
- local index DB
- hybrid retrieval
- shared retrieval context injection
- library UI

### Phase 4: Polish and Release

- iPad optimization
- Android-specific polish and regression work
- performance work
- recovery hardening
- QA automation
- backup and restore
- review material preparation
- release regression

## Rejected Alternatives

### Directly Convert Open WebUI

Rejected because it is structurally browser-plus-server centric and would require more dismantling than building.

### Flutter-First Implementation

Rejected as primary path. It is technically viable, but the strongest architectural references for this product shape are React Native based, and the provider plus streaming ecosystem is more directly reusable there.

### Chat-First Product With Compare Mode Added Later

Rejected because compare mode materially changes the domain model, orchestration, persistence model, and UI. Adding it later would create avoidable rework.

## Final Product Positioning

This product is a `local-first native multimodel AI workbench`.

It is not:

- a mobile wrapper around `open-webui`
- a server-centric AI panel
- a group collaboration product
- a minimal prototype

It is:

- a native single-user AI client
- a multimodel comparison workspace
- a branchable conversation environment
- a local document and retrieval workbench

## Implementation Readiness

The design is ready for the implementation-planning phase after user review of this document.
