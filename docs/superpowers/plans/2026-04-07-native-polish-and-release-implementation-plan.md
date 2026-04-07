# Native Polish And Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the native mobile product to release quality on iPhone, iPad, and Android by adding adaptive layout polish, recovery hardening, backup/restore, QA automation, and App Review / release materials without introducing a server dependency.

**Architecture:** Treat this phase as production hardening rather than feature invention. Consolidate the earlier chat, compare, and local-RAG flows behind stable workspace layout utilities, restart-safe recovery services, and exportable local workspace bundles; then add release-facing documentation and a review-safe demo path so the app can be validated without assuming reviewer-owned provider keys.

**Tech Stack:** React Native, Expo Router, TypeScript, Expo SQLite, Expo Secure Store, React Native Testing Library, Jest Expo, platform-specific QA scripts and release docs

---

## Scope Guard

This plan only covers Phase 4 `Polish And Release`.

- Do implement layout polish for iPhone, iPad, and Android, recovery hardening for compare/indexing state, backup and restore, QA automation, reviewer-safe demo flow, and release documentation.
- Do not add new core end-user features that change the approved product scope.
- Keep the product local-first. Backup/export files may be user-managed artifacts, not a hosted sync service.
- Prefer a built-in `review-demo` provider path over reviewer credentials so App Review can exercise chat, compare, and RAG without needing third-party keys.

## File Structure

### Responsive and workspace polish

- Modify: `mobile/package.json`
- Modify: `mobile/app.json`
- Modify: `mobile/src/app/AppProviders.tsx`
- Create: `mobile/src/ui/layout/useResponsiveLayout.ts`
- Create: `mobile/src/ui/layout/AdaptiveScaffold.tsx`
- Create: `mobile/src/ui/layout/SplitPaneLayout.tsx`
- Modify: `mobile/src/features/chat/ChatScreen.tsx`
- Modify: `mobile/src/features/compare/CompareRunCard.tsx`
- Modify: `mobile/src/features/library/LibraryScreen.tsx`
- Modify: `mobile/src/features/chat/MessageList.tsx`
- Modify: `mobile/app/(tabs)/_layout.tsx`
- Test: `mobile/src/ui/layout/__tests__/useResponsiveLayout.test.ts`
- Test: `mobile/src/features/chat/__tests__/ChatScreen.layout.test.tsx`

### Recovery hardening

- Create: `mobile/src/core/errors/types.ts`
- Create: `mobile/src/core/errors/normalizeProviderError.ts`
- Create: `mobile/src/core/recovery/reconcileAppState.ts`
- Create: `mobile/src/core/recovery/compareRecovery.ts`
- Create: `mobile/src/core/recovery/indexingRecovery.ts`
- Create: `mobile/src/services/RecoveryService.ts`
- Modify: `mobile/src/services/CompareService.ts`
- Modify: `mobile/src/services/DocumentIndexingService.ts`
- Modify: `mobile/src/storage/db/migrate.ts`
- Modify: `mobile/src/storage/index-db/migrate.ts`
- Test: `mobile/src/core/errors/__tests__/normalizeProviderError.test.ts`
- Test: `mobile/src/core/recovery/__tests__/reconcileAppState.test.ts`
- Test: `mobile/src/services/__tests__/RecoveryService.test.ts`

### Backup, restore, and review-safe demo path

- Create: `mobile/src/services/backup/BackupService.ts`
- Create: `mobile/src/services/backup/RestoreService.ts`
- Create: `mobile/src/storage/backup/backupManifest.ts`
- Create: `mobile/src/storage/backup/backupSerializer.ts`
- Create: `mobile/src/storage/backup/restoreValidator.ts`
- Create: `mobile/src/core/providers/adapters/reviewDemo.ts`
- Modify: `mobile/src/features/settings/SettingsScreen.tsx`
- Create: `mobile/src/features/settings/BackupRestoreScreen.tsx`
- Create: `mobile/src/features/settings/ReviewDemoCard.tsx`
- Create: `mobile/src/test/fixtures/reviewDemo/compareRun.json`
- Create: `mobile/src/test/fixtures/reviewDemo/ragContext.json`
- Test: `mobile/src/services/__tests__/BackupRestore.test.ts`
- Test: `mobile/src/features/settings/__tests__/SettingsScreen.release.test.tsx`

### Release docs and QA materials

- Create: `mobile/eas.json`
- Create: `mobile/maestro/provider-setup.yaml`
- Create: `mobile/maestro/single-send.yaml`
- Create: `mobile/maestro/compare-send.yaml`
- Create: `mobile/maestro/branch-continuation.yaml`
- Create: `mobile/maestro/judge.yaml`
- Create: `mobile/maestro/file-import.yaml`
- Create: `mobile/maestro/rag-evidence.yaml`
- Create: `mobile/maestro/kill-recovery.yaml`
- Create: `mobile/maestro/offline-timeout.yaml`
- Create: `docs/superpowers/release/native-mobile-review-notes.md`
- Create: `docs/superpowers/release/native-mobile-manual-qa.md`
- Create: `docs/superpowers/release/native-mobile-privacy-disclosure.md`
- Create: `docs/superpowers/release/native-mobile-release-checklist.md`
- Modify: `mobile/README.md`

## Task 1: Add Adaptive Layout Infrastructure For Phone And Tablet Launch Targets

**Files:**
- Create: `mobile/src/ui/layout/useWorkspaceLayout.ts`
- Create: `mobile/src/ui/layout/AdaptivePane.tsx`
- Modify: `mobile/src/features/chat/ChatScreen.tsx`
- Modify: `mobile/src/features/compare/CompareRunCard.tsx`
- Modify: `mobile/src/features/library/LibraryScreen.tsx`
- Modify: `mobile/app/(tabs)/_layout.tsx`
- Test: `mobile/src/ui/layout/__tests__/useWorkspaceLayout.test.ts`
- Test: `mobile/src/features/chat/__tests__/ChatScreen.layout.test.tsx`

- [ ] **Step 1: Write the failing layout tests**

```ts
// mobile/src/ui/layout/__tests__/useWorkspaceLayout.test.ts
import { getWorkspaceLayout } from '../useWorkspaceLayout'

describe('getWorkspaceLayout', () => {
  it('returns tablet when width is large enough for side-by-side compare columns', () => {
    expect(getWorkspaceLayout({ width: 1024, height: 1366 })).toBe('tablet')
  })
})
```

```tsx
// mobile/src/features/chat/__tests__/ChatScreen.layout.test.tsx
import { render, screen } from '@testing-library/react-native'
import { ChatScreen } from '../ChatScreen'

describe('ChatScreen layout', () => {
  it('renders the secondary pane when tablet layout is active', () => {
    render(<ChatScreen threadId="thread-1" runSingleTurn={async () => {}} layout="tablet" />)
    expect(screen.getByTestId('chat-secondary-pane')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run the layout tests to verify they fail**

Run:

```bash
cd /Users/gwaanl/.config/superpowers/worktrees/open-webui/native-platform-core/mobile
npx -p node@22 -p npm@10 npm test -- --runTestsByPath src/ui/layout/__tests__/useWorkspaceLayout.test.ts src/features/chat/__tests__/ChatScreen.layout.test.tsx --runInBand
```

Expected: FAIL because adaptive layout infrastructure is missing.

- [ ] **Step 3: Implement shared workspace layout helpers**

```ts
// mobile/src/ui/layout/useWorkspaceLayout.ts
export type WorkspaceLayout = 'phone' | 'tablet'

export function getWorkspaceLayout({ width }: { width: number; height: number }): WorkspaceLayout {
  return width >= 900 ? 'tablet' : 'phone'
}
```

```tsx
// mobile/src/ui/layout/AdaptivePane.tsx
export function AdaptivePane({ layout, primary, secondary }: Props) {
  return layout === 'tablet'
    ? <View style={styles.row}>{primary}{secondary}</View>
    : <View style={styles.column}>{primary}</View>
}
```

- [ ] **Step 4: Apply the layout helper to chat, compare, and library screens**

```tsx
// mobile/src/features/chat/ChatScreen.tsx
const layout = explicitLayout ?? getWorkspaceLayout(useWindowDimensions())

return (
  <AdaptivePane
    layout={layout}
    primary={<MessageList items={items} layout={layout} />}
    secondary={<View testID="chat-secondary-pane"><ComposerInspector /></View>}
  />
)
```

- [ ] **Step 5: Run the layout tests and commit**

Run:

```bash
cd /Users/gwaanl/.config/superpowers/worktrees/open-webui/native-platform-core/mobile
npx -p node@22 -p npm@10 npm test -- --runTestsByPath src/ui/layout/__tests__/useWorkspaceLayout.test.ts src/features/chat/__tests__/ChatScreen.layout.test.tsx --runInBand
git add app src
git commit -m "feat: add adaptive mobile workspace layouts"
```

Expected: PASS with stable phone/tablet layout selection.

## Task 2: Harden Recovery For Compare Runs And Indexing Jobs

**Files:**
- Create: `mobile/src/services/RecoveryService.ts`
- Modify: `mobile/src/services/CompareService.ts`
- Modify: `mobile/src/services/DocumentIndexingService.ts`
- Modify: `mobile/src/storage/db/migrate.ts`
- Modify: `mobile/src/storage/indexDb/migrate.ts`
- Test: `mobile/src/services/__tests__/RecoveryService.test.ts`

- [ ] **Step 1: Write the failing recovery test**

```ts
// mobile/src/services/__tests__/RecoveryService.test.ts
import { RecoveryService } from '../RecoveryService'

describe('RecoveryService', () => {
  it('converges interrupted compare runs and index jobs into resumable or failed states', async () => {
    const service = new RecoveryService(/* repository doubles */ {} as never)

    await expect(service.reconcileOnLaunch()).resolves.toMatchObject({
      compareRunsReconciled: 1,
      indexJobsReconciled: 1
    })
  })
})
```

- [ ] **Step 2: Run the recovery test to verify it fails**

Run:

```bash
cd /Users/gwaanl/.config/superpowers/worktrees/open-webui/native-platform-core/mobile
npx -p node@22 -p npm@10 npm test -- --runTestsByPath src/services/__tests__/RecoveryService.test.ts --runInBand
```

Expected: FAIL because there is no launch-time reconciliation service.

- [ ] **Step 3: Implement restart-safe reconciliation rules**

```ts
// mobile/src/services/RecoveryService.ts
export class RecoveryService {
  constructor(private readonly deps: RecoveryDeps) {}

  async reconcileOnLaunch() {
    const compareRuns = await this.deps.compareRepository.findIncompleteRuns()
    const indexJobs = await this.deps.indexRepository.findInterruptedJobs()

    await Promise.all(compareRuns.map((run) => this.deps.compareRepository.markRecoverable(run.id)))
    await Promise.all(indexJobs.map((job) => this.deps.indexRepository.markRecoverable(job.id)))

    return {
      compareRunsReconciled: compareRuns.length,
      indexJobsReconciled: indexJobs.length
    }
  }
}
```

- [ ] **Step 4: Invoke reconciliation during database bootstrap**

```ts
// mobile/src/storage/db/migrate.ts
export async function bootstrapWorkspace(recoveryService: RecoveryService) {
  await runMigrations()
  await recoveryService.reconcileOnLaunch()
}
```

- [ ] **Step 5: Re-run the recovery test and commit**

Run:

```bash
cd /Users/gwaanl/.config/superpowers/worktrees/open-webui/native-platform-core/mobile
npx -p node@22 -p npm@10 npm test -- --runTestsByPath src/services/__tests__/RecoveryService.test.ts --runInBand
git add src/storage src/services
git commit -m "feat: harden mobile recovery flows"
```

Expected: PASS with launch-time recovery behavior codified.

## Task 3: Add Backup, Restore, And Review-Safe Demo Support

**Files:**
- Create: `mobile/src/services/WorkspaceBackupService.ts`
- Create: `mobile/src/services/ReviewDemoService.ts`
- Modify: `mobile/src/features/settings/SettingsScreen.tsx`
- Create: `mobile/src/features/settings/BackupRestoreCard.tsx`
- Create: `mobile/src/features/settings/ReviewDemoCard.tsx`
- Test: `mobile/src/services/__tests__/WorkspaceBackupService.test.ts`
- Test: `mobile/src/features/settings/__tests__/SettingsScreen.release.test.tsx`

- [ ] **Step 1: Write the failing backup and review-demo tests**

```ts
// mobile/src/services/__tests__/WorkspaceBackupService.test.ts
import { WorkspaceBackupService } from '../WorkspaceBackupService'

describe('WorkspaceBackupService', () => {
  it('exports workspace data without leaking stored api keys', async () => {
    const service = new WorkspaceBackupService(/* doubles */ {} as never)
    const archive = await service.exportWorkspace()

    expect(archive.files).toContain('workspace.json')
    expect(JSON.stringify(archive)).not.toContain('sk-')
  })
})
```

```tsx
// mobile/src/features/settings/__tests__/SettingsScreen.release.test.tsx
import { render, screen } from '@testing-library/react-native'
import { SettingsScreen } from '../SettingsScreen'

describe('SettingsScreen release tools', () => {
  it('shows backup and reviewer demo cards', () => {
    render(<SettingsScreen />)
    expect(screen.getByText('Backup & Restore')).toBeTruthy()
    expect(screen.getByText('Review Demo')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
cd /Users/gwaanl/.config/superpowers/worktrees/open-webui/native-platform-core/mobile
npx -p node@22 -p npm@10 npm test -- --runTestsByPath src/services/__tests__/WorkspaceBackupService.test.ts src/features/settings/__tests__/SettingsScreen.release.test.tsx --runInBand
```

Expected: FAIL because backup and review-demo surfaces do not exist.

- [ ] **Step 3: Implement workspace backup and restore**

```ts
// mobile/src/services/WorkspaceBackupService.ts
export class WorkspaceBackupService {
  async exportWorkspace() {
    const snapshot = await this.deps.repository.exportWorkspaceState()
    return {
      files: ['workspace.json'],
      payload: {
        ...snapshot,
        providerProfiles: snapshot.providerProfiles.map(({ apiKeyRef, ...rest }) => rest)
      }
    }
  }
}
```

```tsx
// mobile/src/features/settings/BackupRestoreCard.tsx
export function BackupRestoreCard({ onExport, onImport }: Props) {
  return (
    <View>
      <Text>Backup & Restore</Text>
      <Pressable onPress={onExport}><Text>Export Workspace</Text></Pressable>
      <Pressable onPress={onImport}><Text>Import Workspace</Text></Pressable>
    </View>
  )
}
```

- [ ] **Step 4: Implement the review-safe local demo flow**

```ts
// mobile/src/services/ReviewDemoService.ts
export class ReviewDemoService {
  async seedReviewerWorkspace() {
    return this.deps.repository.installDemoWorkspace({
      threadTitle: 'Model comparison demo',
      documents: ['architecture-guide.pdf'],
      compareRun: 'preloaded'
    })
  }
}
```

- [ ] **Step 5: Run the tests and commit**

Run:

```bash
cd /Users/gwaanl/.config/superpowers/worktrees/open-webui/native-platform-core/mobile
npx -p node@22 -p npm@10 npm test -- --runTestsByPath src/services/__tests__/WorkspaceBackupService.test.ts src/features/settings/__tests__/SettingsScreen.release.test.tsx --runInBand
git add src/features/settings src/services
git commit -m "feat: add release backup and review demo tools"
```

Expected: PASS with backup/restore and a reviewer-safe demo path available from settings.

## Task 4: Produce Release QA And App Review Materials

**Files:**
- Create: `mobile/docs/release/device-qa-matrix.md`
- Create: `mobile/docs/release/reviewer-setup-notes.md`
- Create: `mobile/docs/release/privacy-and-rag-disclosure.md`
- Create: `mobile/docs/release/regression-checklist.md`
- Modify: `mobile/README.md`

- [ ] **Step 1: Draft the release documents**

```md
<!-- mobile/docs/release/device-qa-matrix.md -->
# Device QA Matrix

- small iPhone
- large iPhone
- iPad portrait
- iPad landscape
- small Android phone
- large Android phone
- Android tablet
```

```md
<!-- mobile/docs/release/reviewer-setup-notes.md -->
# Reviewer Setup Notes

1. Open Settings.
2. Tap `Review Demo`.
3. Confirm the seeded demo workspace.
4. Use `Threads`, `Library`, and `Settings` without entering a provider key.
```

- [ ] **Step 2: Run a docs consistency pass**

Run:

```bash
cd /Users/gwaanl/.config/superpowers/worktrees/open-webui/native-platform-core/mobile
rg -n "TODO|TBD" docs/release README.md
```

Expected: no placeholder release text remains.

- [ ] **Step 3: Update the mobile README release section**

```md
<!-- mobile/README.md -->
## Release Readiness

- Review demo path available from Settings
- Provider keys stored only in secure storage
- Local RAG snippets may be sent to external providers when retrieval is enabled
- Backup export excludes API secrets
```

- [ ] **Step 4: Run final mobile verification**

Run:

```bash
cd /Users/gwaanl/.config/superpowers/worktrees/open-webui/native-platform-core/mobile
npx -p node@22 -p npm@10 npm test -- --runInBand
npx -p node@22 -p npm@10 npm run typecheck
```

Expected: PASS with release docs aligned to the implemented behavior.

- [ ] **Step 5: Commit the release materials**

Run:

```bash
cd /Users/gwaanl/.config/superpowers/worktrees/open-webui/native-platform-core
git add mobile/README.md mobile/docs/release
git commit -m "docs: add native mobile release materials"
```

Expected: release-facing QA and App Review documentation is versioned with the app.
