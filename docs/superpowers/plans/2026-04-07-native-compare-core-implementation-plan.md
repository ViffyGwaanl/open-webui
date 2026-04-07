# Native Compare Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add release-grade multi-model compare mode to `mobile/`, including compare persistence, parallel branch execution, optional judge summaries, adaptive phone/tablet compare UI, branch continuation, compare presets, and compare export.

**Architecture:** Extend the existing platform-core app by introducing a dedicated compare domain instead of overloading single-turn chat state. Persist compare runs, branch responses, judge runs, and presets in the main SQLite database; orchestrate compare execution through a service that can recover partial branch success; and render compare turns as stable artifacts inside the thread screen with mobile-first tabbed comparison and tablet split views.

**Tech Stack:** React Native, Expo Router, TypeScript, Expo SQLite, Drizzle ORM, React Native Testing Library, Jest Expo

---

## Scope Guard

This plan only covers Phase 2 `Compare Core`.

- Do implement compare orchestration, compare persistence, judge summaries, branch continuation, compare presets, export, and adaptive compare UI.
- Do not implement local document indexing, embeddings, retrieval evidence drawers, backup/restore, or release-review materials from later plans.
- Reuse the existing single-model provider registry and chat streaming path where possible, but do not collapse compare state into `singleRun.ts`.
- Keep `turns` as the canonical thread timeline: the compare prompt is still a user turn, while compare outputs stay in compare tables and render as a compare card anchored to `promptTurnId` instead of becoming assistant turns in the source thread.

## File Structure

### Database and domain model

- Modify: `mobile/src/storage/db/schema/turns.ts`
- Modify: `mobile/src/storage/db/schema/threads.ts`
- Modify: `mobile/src/storage/db/schema/index.ts`
- Create: `mobile/src/storage/db/schema/comparePresets.ts`
- Create: `mobile/src/storage/db/schema/compareRuns.ts`
- Create: `mobile/src/storage/db/schema/compareBranches.ts`
- Create: `mobile/src/storage/db/schema/judgeRuns.ts`
- Create: `mobile/drizzle/0001_native_compare_core.sql`
- Modify: `mobile/drizzle/meta/_journal.json`
- Modify: `mobile/drizzle/meta/0000_snapshot.json`
- Create: `mobile/drizzle/meta/0001_snapshot.json`
- Test: `mobile/src/storage/db/schema/__tests__/compareSchema.test.ts`

### Compare orchestration

- Create: `mobile/src/core/compare/types.ts`
- Create: `mobile/src/core/compare/stateMachine.ts`
- Create: `mobile/src/core/compare/runCompareTurn.ts`
- Create: `mobile/src/core/compare/runJudgeRun.ts`
- Create: `mobile/src/core/compare/buildJudgePrompt.ts`
- Create: `mobile/src/core/compare/continueFromBranch.ts`
- Create: `mobile/src/core/compare/aggregateRunMetrics.ts`
- Create: `mobile/src/core/compare/compareErrors.ts`
- Create: `mobile/src/core/compare/export.ts`
- Test: `mobile/src/core/compare/__tests__/stateMachine.test.ts`
- Test: `mobile/src/core/compare/__tests__/runCompareTurn.test.ts`
- Test: `mobile/src/core/compare/__tests__/runJudgeRun.test.ts`
- Test: `mobile/src/core/compare/__tests__/continueFromBranch.test.ts`

### Services and thread integration

- Create: `mobile/src/storage/db/repositories/ThreadRepository.ts`
- Create: `mobile/src/storage/db/repositories/CompareRepository.ts`
- Create: `mobile/src/storage/db/repositories/ComparePresetRepository.ts`
- Modify: `mobile/src/services/ThreadService.ts`
- Create: `mobile/src/services/CompareService.ts`
- Create: `mobile/src/services/BranchContinuationService.ts`
- Create: `mobile/src/services/ComparePresetService.ts`
- Test: `mobile/src/services/__tests__/comparePersistence.test.ts`
- Test: `mobile/src/services/__tests__/compareRecovery.test.ts`
- Test: `mobile/src/services/__tests__/comparePresetSnapshot.test.ts`
- Test: `mobile/src/services/__tests__/branchContinuationService.test.ts`

### Compare UI

- Modify: `mobile/src/features/chat/ChatScreen.tsx`
- Modify: `mobile/src/features/chat/MessageComposer.tsx`
- Modify: `mobile/src/features/chat/MessageList.tsx`
- Modify: `mobile/app/threads/[threadId].tsx`
- Modify: `mobile/src/features/settings/SettingsScreen.tsx`
- Create: `mobile/src/features/compare/CompareComposerOptions.tsx`
- Create: `mobile/src/features/compare/CompareRunCard.tsx`
- Create: `mobile/src/features/compare/BranchTabs.tsx`
- Create: `mobile/src/features/compare/BranchPanel.tsx`
- Create: `mobile/src/features/compare/CompareBranchActions.tsx`
- Create: `mobile/src/features/compare/JudgeSummaryCard.tsx`
- Create: `mobile/src/features/compare/ComparePresetPicker.tsx`
- Create: `mobile/src/features/compare/ComparePresetForm.tsx`
- Create: `mobile/src/features/compare/useThreadTimeline.ts`
- Test: `mobile/src/features/compare/__tests__/CompareRunCard.test.tsx`
- Test: `mobile/src/features/compare/__tests__/BranchTabs.test.tsx`
- Test: `mobile/src/features/compare/__tests__/CompareComposerOptions.test.tsx`
- Test: `mobile/src/features/chat/__tests__/ChatScreen.compare.test.tsx`

## Task 1: Add Compare Persistence And Domain Types

**Files:**
- Create: `mobile/src/storage/db/schema/comparePresets.ts`
- Create: `mobile/src/storage/db/schema/compareRuns.ts`
- Create: `mobile/src/storage/db/schema/compareBranches.ts`
- Create: `mobile/src/storage/db/schema/judgeRuns.ts`
- Modify: `mobile/src/storage/db/schema/index.ts`
- Create: `mobile/drizzle/0001_native_compare_core.sql`
- Modify: `mobile/drizzle/meta/_journal.json`
- Modify: `mobile/drizzle/meta/0000_snapshot.json`
- Create: `mobile/drizzle/meta/0001_snapshot.json`
- Create: `mobile/src/core/compare/types.ts`
- Test: `mobile/src/storage/db/schema/__tests__/compareSchema.test.ts`

- [ ] **Step 1: Write the failing schema test**

```ts
// mobile/src/storage/db/schema/__tests__/compareSchema.test.ts
import {
  compareBranches,
  comparePresets,
  compareRuns,
  judgeRuns
} from '../index'

describe('compare schema', () => {
  it('exports compare and judge tables', () => {
    expect(comparePresets.id).toBeDefined()
    expect(compareRuns.threadId).toBeDefined()
    expect(compareBranches.compareRunId).toBeDefined()
    expect(judgeRuns.status).toBeDefined()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
cd /Users/gwaanl/.config/superpowers/worktrees/open-webui/native-platform-core/mobile
npx -p node@22 -p npm@10 npm test -- --runTestsByPath src/storage/db/schema/__tests__/compareSchema.test.ts --runInBand
```

Expected: FAIL because the compare tables are not exported yet.

- [ ] **Step 3: Add the compare tables and migration**

```ts
// mobile/src/storage/db/schema/compareRuns.ts
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const compareRuns = sqliteTable('compare_runs', {
  id: text('id').primaryKey(),
  threadId: text('thread_id').notNull(),
  userTurnId: text('user_turn_id').notNull(),
  status: text('status').notNull(),
  sharedRetrievalContextJson: text('shared_retrieval_context_json').notNull().default('[]'),
  selectedModelIdsJson: text('selected_model_ids_json').notNull(),
  aggregateUsageJson: text('aggregate_usage_json').notNull().default('{}'),
  aggregateTimingJson: text('aggregate_timing_json').notNull().default('{}'),
  judgeEnabled: integer('judge_enabled', { mode: 'boolean' }).notNull().default(false),
  judgeModelId: text('judge_model_id'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull()
})
```

```ts
// mobile/src/core/compare/types.ts
export type CompareRunStatus = 'queued' | 'running' | 'completed' | 'partial' | 'failed'

export type CompareBranchStatus = 'queued' | 'streaming' | 'completed' | 'failed' | 'cancelled'

export type CompareBranchRecord = {
  id: string
  compareRunId: string
  providerProfileId: string
  modelId: string
  status: CompareBranchStatus
  rawAnswer: string
  latencyMs: number | null
  usageJson: string
  errorCode: string | null
  errorMessage: string | null
  continuationThreadId: string | null
}
```

```sql
-- mobile/drizzle/0001_native_compare_core.sql
CREATE TABLE `compare_presets` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `model_selections_json` text NOT NULL,
  `judge_enabled` integer DEFAULT false NOT NULL,
  `judge_model_id` text,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);
```

- [ ] **Step 4: Export the new schema and regenerate snapshots**

Run:

```bash
cd /Users/gwaanl/.config/superpowers/worktrees/open-webui/native-platform-core/mobile
npx -p node@22 -p npm@10 npm run db:generate
```

Expected: `drizzle/meta/0001_snapshot.json` is created and the compare schema compiles cleanly.

- [ ] **Step 5: Run the schema test and commit**

Run:

```bash
cd /Users/gwaanl/.config/superpowers/worktrees/open-webui/native-platform-core/mobile
npx -p node@22 -p npm@10 npm test -- --runTestsByPath src/storage/db/schema/__tests__/compareSchema.test.ts --runInBand
git add src/storage/db/schema drizzle
git commit -m "feat: add native compare persistence schema"
```

Expected: PASS with the new compare tables exported.

## Task 2: Implement Compare Execution, Judge Runs, And Recovery Semantics

**Files:**
- Create: `mobile/src/core/compare/stateMachine.ts`
- Create: `mobile/src/core/compare/compareRun.ts`
- Create: `mobile/src/core/compare/judgeRun.ts`
- Create: `mobile/src/services/CompareService.ts`
- Modify: `mobile/src/services/ThreadService.ts`
- Test: `mobile/src/core/compare/__tests__/stateMachine.test.ts`
- Test: `mobile/src/core/compare/__tests__/compareRun.test.ts`
- Test: `mobile/src/services/__tests__/compareService.test.ts`

- [ ] **Step 1: Write the failing compare state tests**

```ts
// mobile/src/core/compare/__tests__/stateMachine.test.ts
import { reduceCompareEvent } from '../stateMachine'

describe('reduceCompareEvent', () => {
  it('marks the run partial when one branch fails and one succeeds', () => {
    const state = reduceCompareEvent(
      {
        runStatus: 'running',
        branches: {
          a: { status: 'streaming' },
          b: { status: 'streaming' }
        }
      },
      { type: 'branch_failed', branchId: 'a', errorCode: 'timeout' }
    )

    expect(state.branches.a.status).toBe('failed')
    expect(state.runStatus).toBe('running')
  })
})
```

```ts
// mobile/src/services/__tests__/compareService.test.ts
import { CompareService } from '../CompareService'

describe('CompareService', () => {
  it('persists per-branch output and completes the run when all branches settle', async () => {
    const service = new CompareService(/* repository doubles */ {} as never)
    await expect(service.startRun({
      threadId: 'thread-1',
      prompt: 'Compare this answer',
      modelSelections: [
        { providerProfileId: 'openai-main', modelId: 'gpt-4.1' },
        { providerProfileId: 'claude-main', modelId: 'claude-3-7-sonnet' }
      ]
    })).resolves.toMatchObject({
      status: 'completed'
    })
  })
})
```

- [ ] **Step 2: Run the targeted tests to verify they fail**

Run:

```bash
cd /Users/gwaanl/.config/superpowers/worktrees/open-webui/native-platform-core/mobile
npx -p node@22 -p npm@10 npm test -- --runTestsByPath src/core/compare/__tests__/stateMachine.test.ts src/services/__tests__/compareService.test.ts --runInBand
```

Expected: FAIL because compare execution code does not exist yet.

- [ ] **Step 3: Implement the compare state machine and service**

```ts
// mobile/src/core/compare/stateMachine.ts
export function reduceCompareEvent(state: CompareRuntimeState, event: CompareRuntimeEvent): CompareRuntimeState {
  if (event.type === 'branch_completed') {
    const branches = {
      ...state.branches,
      [event.branchId]: { ...state.branches[event.branchId], status: 'completed', usage: event.usage }
    }
    const statuses = Object.values(branches).map((branch) => branch.status)
    const runStatus = statuses.every((status) => status === 'completed')
      ? 'completed'
      : statuses.some((status) => status === 'failed')
        ? 'partial'
        : state.runStatus

    return { ...state, branches, runStatus }
  }

  return state
}
```

```ts
// mobile/src/services/CompareService.ts
export class CompareService {
  constructor(private readonly deps: CompareServiceDeps) {}

  async startRun(input: StartCompareRunInput) {
    const run = await this.deps.repository.createRun(input)

    await Promise.allSettled(
      input.modelSelections.map((selection) =>
        this.deps.executor.streamBranch(run.id, selection, input.prompt)
      )
    )

    const completed = await this.deps.repository.completeRun(run.id)

    if (completed.judgeEnabled) {
      await this.deps.judge.runSummary(completed)
    }

    return completed
  }
}
```

- [ ] **Step 4: Add judge execution and restart-safe completion rules**

```ts
// mobile/src/core/compare/judgeRun.ts
export async function runJudgeSummary(args: {
  branches: Array<{ modelId: string; answer: string; status: string }>
  judgeModelId: string
  streamText: (prompt: string) => Promise<string>
}) {
  const completedBranches = args.branches.filter((branch) => branch.status === 'completed')
  if (completedBranches.length === 0) {
    return null
  }

  const prompt = completedBranches
    .map((branch, index) => `Candidate ${index + 1} (${branch.modelId}):\n${branch.answer}`)
    .join('\n\n')

  return args.streamText(prompt)
}
```

- [ ] **Step 5: Run the targeted tests and commit**

Run:

```bash
cd /Users/gwaanl/.config/superpowers/worktrees/open-webui/native-platform-core/mobile
npx -p node@22 -p npm@10 npm test -- --runTestsByPath src/core/compare/__tests__/stateMachine.test.ts src/core/compare/__tests__/compareRun.test.ts src/services/__tests__/compareService.test.ts --runInBand
git add src/core/compare src/services
git commit -m "feat: add compare orchestration core"
```

Expected: PASS with branch-level partial failure preserved and judge execution gated on successful branches.

## Task 3: Build Mobile-First Compare UI And Composer Controls

**Files:**
- Modify: `mobile/src/features/chat/ChatScreen.tsx`
- Modify: `mobile/src/features/chat/MessageComposer.tsx`
- Modify: `mobile/src/features/chat/MessageList.tsx`
- Modify: `mobile/app/threads/[threadId].tsx`
- Create: `mobile/src/features/compare/CompareComposerSheet.tsx`
- Create: `mobile/src/features/compare/CompareRunCard.tsx`
- Create: `mobile/src/features/compare/CompareBranchTabs.tsx`
- Create: `mobile/src/features/compare/CompareBranchColumnLayout.tsx`
- Create: `mobile/src/features/compare/JudgeSummaryCard.tsx`
- Test: `mobile/src/features/compare/__tests__/CompareRunCard.test.tsx`
- Test: `mobile/src/features/chat/__tests__/ChatScreen.compare.test.tsx`

- [ ] **Step 1: Write the failing UI tests**

```tsx
// mobile/src/features/compare/__tests__/CompareRunCard.test.tsx
import { render, screen } from '@testing-library/react-native'
import { CompareRunCard } from '../CompareRunCard'

describe('CompareRunCard', () => {
  it('shows a tabbed branch selector on phone layouts', () => {
    render(
      <CompareRunCard
        layout="phone"
        run={{
          id: 'compare-1',
          judgeSummary: 'Model A was more complete.',
          branches: [
            { id: 'a', modelLabel: 'GPT-4.1', answer: 'Answer A', status: 'completed' },
            { id: 'b', modelLabel: 'Claude 3.7', answer: 'Answer B', status: 'completed' }
          ]
        }}
      />
    )

    expect(screen.getByText('GPT-4.1')).toBeTruthy()
    expect(screen.getByText('Model A was more complete.')).toBeTruthy()
  })
})
```

```tsx
// mobile/src/features/chat/__tests__/ChatScreen.compare.test.tsx
import { fireEvent, render, screen } from '@testing-library/react-native'
import { ChatScreen } from '../ChatScreen'

describe('ChatScreen compare mode', () => {
  it('submits a compare request from the composer mode switcher', async () => {
    const runCompareTurn = jest.fn().mockResolvedValue(undefined)

    render(<ChatScreen threadId="thread-1" runSingleTurn={async () => {}} runCompareTurn={runCompareTurn} />)

    fireEvent.press(screen.getByText('Compare'))
    fireEvent.changeText(screen.getByPlaceholderText('Ask anything'), 'Explain this code')
    fireEvent.press(screen.getByText('Send'))

    expect(runCompareTurn).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run the UI tests to verify they fail**

Run:

```bash
cd /Users/gwaanl/.config/superpowers/worktrees/open-webui/native-platform-core/mobile
npx -p node@22 -p npm@10 npm test -- --runTestsByPath src/features/compare/__tests__/CompareRunCard.test.tsx src/features/chat/__tests__/ChatScreen.compare.test.tsx --runInBand
```

Expected: FAIL because compare UI components and composer mode switching do not exist.

- [ ] **Step 3: Add compare mode controls to the thread screen**

```tsx
// mobile/src/features/chat/ChatScreen.tsx
const [composerMode, setComposerMode] = useState<'single' | 'compare'>('single')

<MessageComposer
  value={prompt}
  mode={composerMode}
  onModeChange={setComposerMode}
  onSend={async () => {
    if (composerMode === 'compare') {
      await runCompareTurn({ threadId, prompt })
    } else {
      await runSingleTurn({ threadId, prompt, onDelta: async (text) => setMessages((current) => [...current, text]) })
    }
  }}
/>
```

```tsx
// mobile/src/features/compare/CompareRunCard.tsx
export function CompareRunCard({ layout, run }: CompareRunCardProps) {
  return (
    <View>
      <JudgeSummaryCard summary={run.judgeSummary} />
      {layout === 'tablet' ? (
        <CompareBranchColumnLayout branches={run.branches} />
      ) : (
        <CompareBranchTabs branches={run.branches} />
      )}
    </View>
  )
}
```

- [ ] **Step 4: Wire compare turns into the message list**

```tsx
// mobile/src/features/chat/MessageList.tsx
return (
  <View style={styles.list}>
    {items.map((item) =>
      item.kind === 'compare_run' ? (
        <CompareRunCard key={item.id} layout={layout} run={item} />
      ) : (
        <Text key={item.id} style={styles.message}>
          {item.text}
        </Text>
      )
    )}
  </View>
)
```

- [ ] **Step 5: Run the UI tests and commit**

Run:

```bash
cd /Users/gwaanl/.config/superpowers/worktrees/open-webui/native-platform-core/mobile
npx -p node@22 -p npm@10 npm test -- --runTestsByPath src/features/compare/__tests__/CompareRunCard.test.tsx src/features/chat/__tests__/ChatScreen.compare.test.tsx --runInBand
git add app/threads/[threadId].tsx src/features/chat src/features/compare
git commit -m "feat: add compare mode thread ui"
```

Expected: PASS with phone tabs and tablet column rendering paths covered.

## Task 4: Add Branch Continuation, Compare Export, And End-To-End Compare Coverage

**Files:**
- Create: `mobile/src/services/BranchContinuationService.ts`
- Create: `mobile/src/core/compare/export.ts`
- Create: `mobile/src/features/compare/CompareBranchActions.tsx`
- Modify: `mobile/src/services/ThreadService.ts`
- Modify: `mobile/src/features/compare/CompareRunCard.tsx`
- Test: `mobile/src/services/__tests__/branchContinuationService.test.ts`
- Test: `mobile/src/core/compare/__tests__/compareRun.test.ts`
- Test: `mobile/src/features/chat/__tests__/ChatScreen.compare.test.tsx`

- [ ] **Step 1: Write the failing continuation and export tests**

```ts
// mobile/src/services/__tests__/branchContinuationService.test.ts
import { BranchContinuationService } from '../BranchContinuationService'

describe('BranchContinuationService', () => {
  it('creates a child thread from the parent history plus the selected branch answer', async () => {
    const service = new BranchContinuationService(/* repository doubles */ {} as never)
    await expect(
      service.continueBranch({
        threadId: 'thread-1',
        compareRunId: 'compare-1',
        branchId: 'branch-b'
      })
    ).resolves.toMatchObject({
      sourceThreadId: 'thread-1',
      sourceBranchId: 'branch-b'
    })
  })
})
```

```ts
// mobile/src/core/compare/__tests__/compareRun.test.ts
import { exportCompareRunMarkdown } from '../export'

describe('exportCompareRunMarkdown', () => {
  it('includes judge summary and each completed branch', () => {
    const markdown = exportCompareRunMarkdown({
      prompt: 'Summarize the design',
      judgeSummary: 'Candidate 2 is the clearest.',
      branches: [{ modelLabel: 'GPT-4.1', answer: 'Answer A', status: 'completed' }]
    })

    expect(markdown).toContain('Candidate 2 is the clearest.')
    expect(markdown).toContain('GPT-4.1')
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
cd /Users/gwaanl/.config/superpowers/worktrees/open-webui/native-platform-core/mobile
npx -p node@22 -p npm@10 npm test -- --runTestsByPath src/services/__tests__/branchContinuationService.test.ts src/core/compare/__tests__/compareRun.test.ts --runInBand
```

Expected: FAIL because continuation and compare export are not implemented.

- [ ] **Step 3: Implement branch continuation and compare export**

```ts
// mobile/src/services/BranchContinuationService.ts
export class BranchContinuationService {
  constructor(private readonly deps: BranchContinuationDeps) {}

  async continueBranch(input: ContinueBranchInput) {
    const source = await this.deps.repository.loadBranchLineage(input)
    const childThread = await this.deps.repository.createChildThread({
      sourceThreadId: input.threadId,
      sourceBranchId: input.branchId,
      title: source.prompt
    })

    await this.deps.repository.copyLineageIntoChild(childThread.id, source)
    return childThread
  }
}
```

```ts
// mobile/src/core/compare/export.ts
export function exportCompareRunMarkdown(run: ExportableCompareRun) {
  const branchSections = run.branches
    .filter((branch) => branch.status === 'completed')
    .map((branch) => `## ${branch.modelLabel}\n\n${branch.answer}`)
    .join('\n\n')

  return `# Compare Run\n\n## Prompt\n\n${run.prompt}\n\n## Judge Summary\n\n${run.judgeSummary ?? 'Not generated'}\n\n${branchSections}`
}
```

- [ ] **Step 4: Add branch action buttons to the compare card**

```tsx
// mobile/src/features/compare/CompareBranchActions.tsx
export function CompareBranchActions({ onContinue, onRetry, onCopy, onExport, onFavorite }: Props) {
  return (
    <View style={styles.row}>
      <Pressable onPress={onContinue}><Text>Continue</Text></Pressable>
      <Pressable onPress={onRetry}><Text>Retry</Text></Pressable>
      <Pressable onPress={onCopy}><Text>Copy</Text></Pressable>
      <Pressable onPress={onExport}><Text>Export</Text></Pressable>
      <Pressable onPress={onFavorite}><Text>Favorite</Text></Pressable>
    </View>
  )
}
```

- [ ] **Step 5: Run compare-focused tests, then commit**

Run:

```bash
cd /Users/gwaanl/.config/superpowers/worktrees/open-webui/native-platform-core/mobile
npx -p node@22 -p npm@10 npm test -- --runInBand
npx -p node@22 -p npm@10 npm run typecheck
git add src/core/compare src/features/compare src/services src/features/chat
git commit -m "feat: finish native compare core flows"
```

Expected: PASS with branch continuation, export, and compare UI flows covered by the mobile test suite.
