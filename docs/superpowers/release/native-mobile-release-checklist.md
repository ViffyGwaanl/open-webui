# Native Mobile Release Checklist

## Verification

- run `npx -p node@22 -p npm@10 npm run typecheck` in `mobile/`
- run `npx -p node@22 -p npm@10 npm test -- --runInBand` in `mobile/`
- run targeted Maestro smoke flows against a device build

## Product Scope Check

- confirm no server deployment is required
- confirm no channel or collaboration UI remains in scope
- confirm OpenAI, Gemini, Claude, and `review-demo` provider paths are visible
- confirm local RAG still supports `txt`, `md`, and `pdf`
- confirm compare mode supports judge summary, export, and branch continuation

## Store Submission Materials

- review notes included for App Review and Play testing
- privacy disclosure matches direct-to-provider networking
- screenshots captured for iPhone, iPad, and Android
- TestFlight and internal Android preview build created

## Recovery And Data Safety

- backup creation verified on a populated workspace
- restore verified from a fresh launch
- interrupted compare and indexing relaunch path verified

## Sign-off

- iOS phone QA complete
- iPad QA complete
- Android phone QA complete
- Android tablet QA complete if target device is available
