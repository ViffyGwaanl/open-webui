# Native Mobile Review Notes

## Product Summary

This app is a standalone local-first mobile client for iPhone, iPad, and Android. It does not require deploying the Open WebUI server stack. The app stores chat, compare runs, RAG indexes, and recovery metadata on the device.

Supported provider formats:

- OpenAI-compatible chat and embeddings
- Gemini chat and embeddings
- Claude chat
- a built-in `review-demo` provider for App Review and QA

Removed from scope:

- multi-user accounts
- channels
- team collaboration
- hosted sync

## Review Path

Use the in-app `Install Review Demo` action on the Settings tab. That action seeds:

- one local `review-demo-main` provider profile
- one active compare preset with three deterministic chat models
- one local markdown document for RAG validation

After install, App Review can validate:

- single-model send
- compare mode with judge summary
- branch continuation
- local RAG evidence display
- backup and restore controls

## Recommended Reviewer Flow

1. Open `Settings`.
2. Tap `Install Review Demo`.
3. Open `Threads` and tap `Open starter thread`.
4. Send one `Single` message and confirm a deterministic response.
5. Switch to `Compare`, send a prompt, and inspect `Judge Summary`.
6. Tap `Continue` on one branch and confirm a new thread opens.
7. Switch to `RAG`, send a prompt, and confirm evidence appears from `review-demo-guide.md`.
8. Return to `Settings` and run `Create Backup`.
9. Copy the generated backup URI from the success alert.
10. Paste that URI into `Backup file URI` and tap `Restore Backup`.
11. Confirm the `Restore Completed` alert appears with restored provider and document counts.

## Important Constraints

- External providers require user-supplied API keys and base URLs.
- `review-demo` is local only and exists for review, QA, and demo safety.
- Document import supports `txt`, `md`, and `pdf`.
- All backup artifacts are local JSON bundles managed by the user.
