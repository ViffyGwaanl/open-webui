# Native Mobile Manual QA

## Device Matrix

- iPhone: latest supported iOS phone form factor
- iPad: latest supported iPadOS tablet form factor
- Android phone: current Android release
- Android tablet: current Android release if available

## Core Functional QA

### Provider setup

1. Add one OpenAI profile with a real key and default base URL.
2. Add one Gemini profile with a real key and default base URL.
3. Add one Claude profile with a real key and default base URL.
4. Confirm each profile appears on the Settings screen.

### Single chat

1. Open `Threads`.
2. Open the starter thread.
3. Send one single-model prompt.
4. Confirm the assistant turn streams and completes.

### Compare mode

1. Ensure at least two chat-capable profiles resolve models.
2. Save a compare preset.
3. Open the starter thread and switch to `Compare`.
4. Send a prompt.
5. Confirm all branch tabs render.
6. Confirm `Judge Summary` renders when a judge is configured.
7. Confirm `Copy`, `Export`, and `Continue` actions work.

### Local RAG

1. Import one `txt`, one `md`, and one `pdf` document.
2. Confirm each appears in `Library`.
3. Open each detail screen and confirm metadata plus excerpt render.
4. Run a `RAG` prompt and confirm evidence is shown.
5. Run a compare preset with shared context enabled and confirm branches use the same evidence set.

### Recovery

1. Start a compare run.
2. Kill the app before the run completes.
3. Relaunch the app.
4. Confirm the app boots cleanly and prior thread state remains readable.
5. Repeat the same flow during document indexing.

### Backup and restore

1. Create a backup from `Settings`.
2. Record the generated URI.
3. Restore from that URI.
4. Confirm provider profiles, threads, and library documents still load.

## Review Demo QA

1. Tap `Install Review Demo`.
2. Confirm `Review Demo` appears as a provider profile.
3. Confirm `review-demo-guide.md` appears in `Library`.
4. Validate single send, compare send, branch continuation, and RAG using only `review-demo`.

## Regression Risks

- provider profile save paths use lazy service creation for Jest-safe imports
- compare continuation must not overwrite source threads
- restore must not leave non-demo provider profiles enabled unexpectedly
- PDF extraction must work on both iOS and Android native module implementations
