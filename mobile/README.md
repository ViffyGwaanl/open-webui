# Open WebUI Native

`mobile/` contains the standalone React Native + Expo client for the native multimodel AI workbench.

## Product Scope

The mobile app is local-first and does not require a self-hosted backend.

Current release scope:

- on-device workspace state with SQLite
- provider profiles with user-supplied API key and base URL
- OpenAI, Gemini, Claude, and `review-demo` provider presets
- single-model chat
- compare runs with optional judge summaries
- branch continuation from compare results
- local RAG for `txt`, `md`, and `pdf`
- document library, document detail, and retrieved evidence review
- launch-time recovery for interrupted compare and indexing work
- local backup and restore

Explicit non-goals for this app:

- channels
- multiplayer collaboration
- server-hosted sync
- server-side administration

## Architecture

The app keeps primary workspace data in `openwebui-native.db` and local retrieval state in `openwebui-native-rag.db`. API keys stay in Expo Secure Store, while imported RAG files stay under the app document directory.

External model calls are direct:

- users enter their own provider API key and base URL in `Settings`
- no Open WebUI backend is required for chat, compare, judge, or RAG
- when external providers are used, prompts and selected RAG snippets are sent directly to those providers

`review-demo` is the built-in deterministic provider path for App Review and smoke testing. It avoids any reviewer-owned credentials while still exercising chat, compare, judge, and RAG flows.

## Workspace Tabs

- `Threads`: open the starter thread and run single, compare, or RAG sends
- `Library`: import local files, inspect indexing status, and open document detail
- `Settings`: manage provider profiles, compare presets, release tools, and review-demo setup

## Release Features

### Compare and judge

- compare mode can use either the active compare preset or the first two enabled provider profiles
- judge summaries render inline above branch tabs
- each compare card exposes `Continue`, `Copy`, and `Export`

### Local RAG

- supported import formats: `txt`, `md`, `pdf`
- imported files remain on device
- text is chunked and indexed locally
- retrieved evidence is shown in the chat UI after a RAG send

### Recovery

On launch, the app reconciles interrupted compare runs and indexing jobs before rendering the workspace. The current recovery strategy marks incomplete work as interrupted, partial, or pending instead of silently resuming background execution.

### Backup and restore

Backup bundles are local JSON exports containing:

- main workspace database rows
- RAG database rows
- managed imported document files

Backup bundles omit Secure Store secrets. Restored non-demo provider profiles are disabled until the user re-enters API keys.

## Build Profiles

`mobile/eas.json` defines three EAS build profiles:

- `development`: development client for device-side iteration
- `preview`: internal QA builds for iOS and Android
- `production`: store-ready iOS archive plus Android app bundle

The current app identifiers are:

- iOS bundle ID: `com.openwebui.mobile`
- Android package: `com.openwebui.mobile`

## Local Commands

```bash
cd mobile
npm install
npm run ios
npm run android
npm test -- --runInBand
npm run typecheck
```

## Maestro Flows

Smoke and QA drafts live in `mobile/maestro/`.

- `provider-setup.yaml`
- `single-send.yaml`
- `compare-send.yaml`
- `branch-continuation.yaml`
- `judge.yaml`
- `file-import.yaml`
- `rag-evidence.yaml`
- `kill-recovery.yaml`
- `offline-timeout.yaml`

These flows are parameterized. Override defaults with `maestro test -e KEY=value`.

Example:

```bash
maestro test \
  -e PROVIDER_PRESET="OpenAI" \
  -e DISPLAY_NAME="OpenAI Main" \
  -e BASE_URL="https://api.openai.com/v1" \
  -e API_KEY="sk-..." \
  mobile/maestro/provider-setup.yaml
```

## Release Documentation

Release docs live in `docs/superpowers/release/`.

- `native-mobile-review-notes.md`
- `native-mobile-manual-qa.md`
- `native-mobile-privacy-disclosure.md`
- `native-mobile-release-checklist.md`
