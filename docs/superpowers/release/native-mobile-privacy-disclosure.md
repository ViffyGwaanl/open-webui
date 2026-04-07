# Native Mobile Privacy Disclosure

## Local Storage

The app stores the following data on-device:

- provider profile metadata
- secure API key references
- thread history and compare artifacts
- local RAG document indexes and evidence snapshots
- backup bundles created by the user

API keys are intended to live in secure storage. Chat content, compare state, and local RAG indexes are stored in local SQLite databases and app-managed files.

## Network Traffic

The app does not depend on an Open WebUI server deployment. Network requests are sent directly from the device to user-configured model providers.

Supported outbound provider patterns:

- OpenAI-compatible endpoints
- Gemini endpoints
- Claude endpoints

The built-in `review-demo` provider is local and does not send network traffic.

## User Documents

Imported `txt`, `md`, and `pdf` documents are copied into app-managed local storage for indexing. Document text and chunk embeddings are used only for on-device retrieval workflows, except for outbound embedding requests sent directly to the user-selected embedding provider.

## No Hosted Collaboration

This mobile app does not include:

- user accounts
- shared channels
- collaboration workspaces
- hosted synchronization

## Backup Handling

Backup files are exported as user-managed JSON bundles. The app does not upload those bundles to any hosted service.
