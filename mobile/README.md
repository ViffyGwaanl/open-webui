# Mobile App Shell

This directory contains the standalone Expo Router shell for the native multimodel AI workbench.

Current scope:

- Expo Router entry under `app/`
- three top-level workspaces: `Threads`, `Library`, `Settings`
- shared `AppProviders` wrapper around `SafeAreaProvider`
- Jest coverage for the workspace tab contract

Commands:

- `npm install`
- `npm test -- --runTestsByPath src/app/__tests__/workspaceTabs.test.ts --runInBand`
- `npm run typecheck`
