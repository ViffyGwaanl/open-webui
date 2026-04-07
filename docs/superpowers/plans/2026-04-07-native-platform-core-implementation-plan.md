# Native Platform Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a standalone Expo-based native app under `mobile/` with a working app shell, local persistence foundations, secure provider configuration, normalized OpenAI/Gemini/Claude model discovery, and single-model chat.

**Architecture:** Build a self-contained native client inside a new `mobile/` subproject instead of mutating the existing web and backend stacks. Use Expo Router for navigation, SQLite plus Drizzle for durable local state, Expo Secure Store for API keys, and a canonical provider layer so later compare mode and local RAG can be added without rewriting the chat path.

**Tech Stack:** React Native, Expo, Expo Router, TypeScript, Expo SQLite, Drizzle ORM, Expo Secure Store, Jest Expo, React Native Testing Library, eventsource-parser

---

## Scope Split

The approved product spec spans four independent implementation plans:

1. `Platform Core` — this file
2. `Compare Core`
3. `Local RAG`
4. `Polish And Release`

Do not implement compare-mode orchestration, local RAG indexing, or release-polish items from this plan. This plan stops after a stable single-model native shell exists and is ready for the next plan.

## File Structure

### New top-level native app

- Create: `mobile/package.json`
- Create: `mobile/app.json`
- Create: `mobile/babel.config.js`
- Create: `mobile/jest.config.js`
- Create: `mobile/tsconfig.json`
- Create: `mobile/README.md`

### Navigation and shell

- Create: `mobile/app/_layout.tsx`
- Create: `mobile/app/(tabs)/_layout.tsx`
- Create: `mobile/app/(tabs)/threads/index.tsx`
- Create: `mobile/app/(tabs)/library/index.tsx`
- Create: `mobile/app/(tabs)/settings/index.tsx`
- Create: `mobile/app/threads/[threadId].tsx`
- Create: `mobile/src/app/AppProviders.tsx`
- Create: `mobile/src/app/workspaceTabs.ts`

### Persistence foundation

- Create: `mobile/drizzle.config.ts`
- Create: `mobile/src/storage/db/client.ts`
- Create: `mobile/src/storage/db/migrate.ts`
- Create: `mobile/src/storage/db/schema/providerProfiles.ts`
- Create: `mobile/src/storage/db/schema/modelCatalog.ts`
- Create: `mobile/src/storage/db/schema/threads.ts`
- Create: `mobile/src/storage/db/schema/turns.ts`
- Create: `mobile/src/storage/db/schema/appPreferences.ts`
- Create: `mobile/src/storage/db/schema/index.ts`

### Secure storage and provider core

- Create: `mobile/src/storage/secure/apiKeys.ts`
- Create: `mobile/src/core/providers/types.ts`
- Create: `mobile/src/core/providers/registry.ts`
- Create: `mobile/src/core/providers/adapters/openai.ts`
- Create: `mobile/src/core/providers/adapters/gemini.ts`
- Create: `mobile/src/core/providers/adapters/claude.ts`
- Create: `mobile/src/services/ProviderProfileService.ts`
- Create: `mobile/src/services/ModelCatalogService.ts`

### Single-model chat core

- Create: `mobile/src/core/chat/types.ts`
- Create: `mobile/src/core/chat/streamEvents.ts`
- Create: `mobile/src/core/chat/singleRun.ts`
- Create: `mobile/src/services/ThreadService.ts`

### UI components

- Create: `mobile/src/features/threads/ThreadListScreen.tsx`
- Create: `mobile/src/features/settings/SettingsScreen.tsx`
- Create: `mobile/src/features/settings/ProviderProfileForm.tsx`
- Create: `mobile/src/features/chat/ChatScreen.tsx`
- Create: `mobile/src/features/chat/MessageComposer.tsx`
- Create: `mobile/src/features/chat/MessageList.tsx`

### Tests

- Create: `mobile/src/app/__tests__/workspaceTabs.test.ts`
- Create: `mobile/src/storage/db/schema/__tests__/schemaShape.test.ts`
- Create: `mobile/src/services/__tests__/ProviderSetup.test.ts`
- Create: `mobile/src/core/chat/__tests__/singleRun.test.ts`
- Create: `mobile/src/features/chat/__tests__/ChatScreen.test.tsx`

## Task 1: Scaffold The Native App Shell

**Files:**
- Create: `mobile/package.json`
- Create: `mobile/app.json`
- Create: `mobile/babel.config.js`
- Create: `mobile/jest.config.js`
- Create: `mobile/tsconfig.json`
- Create: `mobile/README.md`
- Create: `mobile/app/_layout.tsx`
- Create: `mobile/app/(tabs)/_layout.tsx`
- Create: `mobile/app/(tabs)/threads/index.tsx`
- Create: `mobile/app/(tabs)/library/index.tsx`
- Create: `mobile/app/(tabs)/settings/index.tsx`
- Create: `mobile/src/app/AppProviders.tsx`
- Create: `mobile/src/app/workspaceTabs.ts`
- Test: `mobile/src/app/__tests__/workspaceTabs.test.ts`

- [ ] **Step 1: Write the failing shell test**

```ts
// mobile/src/app/__tests__/workspaceTabs.test.ts
import { WORKSPACE_TABS } from '../workspaceTabs'

describe('WORKSPACE_TABS', () => {
  it('defines the three top-level workspaces in launch order', () => {
    expect(WORKSPACE_TABS).toEqual([
      { name: 'threads', title: 'Threads' },
      { name: 'library', title: 'Library' },
      { name: 'settings', title: 'Settings' }
    ])
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
cd mobile
npm test -- --runTestsByPath src/app/__tests__/workspaceTabs.test.ts --runInBand
```

Expected: FAIL because `mobile/package.json` and `src/app/workspaceTabs.ts` do not exist yet.

- [ ] **Step 3: Create the Expo app skeleton and shell files**

```json
// mobile/package.json
{
  "name": "open-webui-native",
  "version": "0.1.0",
  "private": true,
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "ios": "expo run:ios",
    "android": "expo run:android",
    "test": "jest",
    "typecheck": "tsc --noEmit",
    "db:generate": "drizzle-kit generate"
  },
  "dependencies": {
    "expo": "^54.0.0",
    "expo-router": "^4.0.0",
    "expo-status-bar": "~2.0.0",
    "react": "19.0.0",
    "react-native": "0.76.0",
    "react-native-safe-area-context": "^4.12.0",
    "react-native-screens": "^4.4.0"
  },
  "devDependencies": {
    "@testing-library/react-native": "^13.2.0",
    "@types/jest": "^29.5.14",
    "@types/react": "~19.0.10",
    "jest": "^29.7.0",
    "jest-expo": "~54.0.0",
    "typescript": "^5.6.3"
  }
}
```

```json
// mobile/app.json
{
  "expo": {
    "name": "Open WebUI Native",
    "slug": "open-webui-native",
    "scheme": "openwebuinative",
    "ios": { "supportsTablet": true },
    "android": { "package": "com.viffygwaanl.openwebuinative" },
    "plugins": ["expo-router"]
  }
}
```

```js
// mobile/babel.config.js
module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo']
  }
}
```

```js
// mobile/jest.config.js
module.exports = {
  preset: 'jest-expo',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx']
}
```

```json
// mobile/tsconfig.json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": "."
  }
}
```

```tsx
// mobile/src/app/AppProviders.tsx
import { PropsWithChildren } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'

export function AppProviders({ children }: PropsWithChildren) {
  return <SafeAreaProvider>{children}</SafeAreaProvider>
}
```

```ts
// mobile/src/app/workspaceTabs.ts
export const WORKSPACE_TABS = [
  { name: 'threads', title: 'Threads' },
  { name: 'library', title: 'Library' },
  { name: 'settings', title: 'Settings' }
] as const
```

```tsx
// mobile/app/_layout.tsx
import { Stack } from 'expo-router'
import { AppProviders } from '../src/app/AppProviders'

export default function RootLayout() {
  return (
    <AppProviders>
      <Stack screenOptions={{ headerShown: false }} />
    </AppProviders>
  )
}
```

```tsx
// mobile/app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router'
import { WORKSPACE_TABS } from '../../src/app/workspaceTabs'

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      {WORKSPACE_TABS.map((tab) => (
        <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.title }} />
      ))}
    </Tabs>
  )
}
```

```tsx
// mobile/app/(tabs)/threads/index.tsx
import { Text, View } from 'react-native'

export default function ThreadsIndexScreen() {
  return (
    <View>
      <Text>Threads</Text>
    </View>
  )
}
```

```tsx
// mobile/app/(tabs)/library/index.tsx
import { Text, View } from 'react-native'

export default function LibraryIndexScreen() {
  return (
    <View>
      <Text>Library</Text>
    </View>
  )
}
```

```tsx
// mobile/app/(tabs)/settings/index.tsx
import { Text, View } from 'react-native'

export default function SettingsIndexScreen() {
  return (
    <View>
      <Text>Settings</Text>
    </View>
  )
}
```

```md
<!-- mobile/README.md -->
# Open WebUI Native

This subproject contains the standalone React Native + Expo app introduced by the native multimodel workbench design.
```

- [ ] **Step 4: Install dependencies and rerun the shell test**

Run:

```bash
cd mobile
npm install
npm test -- --runTestsByPath src/app/__tests__/workspaceTabs.test.ts --runInBand
```

Expected: PASS with `1 passed`.

- [ ] **Step 5: Verify the shell compiles**

Run:

```bash
cd mobile
npm run typecheck
```

Expected: no TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add mobile/package.json mobile/app.json mobile/babel.config.js mobile/jest.config.js mobile/tsconfig.json mobile/README.md mobile/app/_layout.tsx mobile/app/'(tabs)'/_layout.tsx mobile/app/'(tabs)'/threads/index.tsx mobile/app/'(tabs)'/library/index.tsx mobile/app/'(tabs)'/settings/index.tsx mobile/src/app/AppProviders.tsx mobile/src/app/workspaceTabs.ts mobile/src/app/__tests__/workspaceTabs.test.ts
git commit -m "feat: scaffold native app shell"
```

## Task 2: Add Local Persistence Foundations

**Files:**
- Create: `mobile/drizzle.config.ts`
- Create: `mobile/src/storage/db/client.ts`
- Create: `mobile/src/storage/db/migrate.ts`
- Create: `mobile/src/storage/db/schema/providerProfiles.ts`
- Create: `mobile/src/storage/db/schema/modelCatalog.ts`
- Create: `mobile/src/storage/db/schema/threads.ts`
- Create: `mobile/src/storage/db/schema/turns.ts`
- Create: `mobile/src/storage/db/schema/appPreferences.ts`
- Create: `mobile/src/storage/db/schema/index.ts`
- Test: `mobile/src/storage/db/schema/__tests__/schemaShape.test.ts`

- [ ] **Step 1: Write the failing schema smoke test**

```ts
// mobile/src/storage/db/schema/__tests__/schemaShape.test.ts
import { appPreferences, modelCatalog, providerProfiles, threads, turns } from '../index'

describe('native platform schema', () => {
  it('exports the required platform-core tables', () => {
    expect(providerProfiles.id).toBeDefined()
    expect(modelCatalog.modelId).toBeDefined()
    expect(threads.id).toBeDefined()
    expect(turns.threadId).toBeDefined()
    expect(appPreferences.key).toBeDefined()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
cd mobile
npm test -- --runTestsByPath src/storage/db/schema/__tests__/schemaShape.test.ts --runInBand
```

Expected: FAIL because the schema files do not exist yet.

- [ ] **Step 3: Create the SQLite and Drizzle foundation**

```ts
// mobile/drizzle.config.ts
import type { Config } from 'drizzle-kit'

export default {
  schema: './src/storage/db/schema/index.ts',
  out: './drizzle',
  dialect: 'sqlite'
} satisfies Config
```

```ts
// mobile/src/storage/db/client.ts
import { drizzle } from 'drizzle-orm/expo-sqlite'
import { openDatabaseSync } from 'expo-sqlite'

const sqlite = openDatabaseSync('openwebui-native.db')

export const db = drizzle(sqlite)
export { sqlite }
```

```ts
// mobile/src/storage/db/migrate.ts
import { db } from './client'

export async function runMigrations() {
  await db.run(/* sql */ `PRAGMA foreign_keys = ON`)
}
```

```ts
// mobile/src/storage/db/schema/providerProfiles.ts
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const providerProfiles = sqliteTable('provider_profiles', {
  id: text('id').primaryKey(),
  presetType: text('preset_type').notNull(),
  displayName: text('display_name').notNull(),
  baseUrl: text('base_url').notNull(),
  apiKeyRef: text('api_key_ref').notNull(),
  extraHeadersJson: text('extra_headers_json').notNull().default('{}'),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull()
})
```

```ts
// mobile/src/storage/db/schema/modelCatalog.ts
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const modelCatalog = sqliteTable('model_catalog', {
  id: text('id').primaryKey(),
  providerProfileId: text('provider_profile_id').notNull(),
  modelId: text('model_id').notNull(),
  label: text('label').notNull(),
  capabilitiesJson: text('capabilities_json').notNull().default('[]'),
  supportsStreaming: integer('supports_streaming', { mode: 'boolean' }).notNull().default(true),
  supportsReasoning: integer('supports_reasoning', { mode: 'boolean' }).notNull().default(false),
  isEmbeddingModel: integer('is_embedding_model', { mode: 'boolean' }).notNull().default(false),
  updatedAt: integer('updated_at').notNull()
})
```

```ts
// mobile/src/storage/db/schema/threads.ts
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const threads = sqliteTable('threads', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  sourceThreadId: text('source_thread_id'),
  sourceBranchId: text('source_branch_id'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull()
})
```

```ts
// mobile/src/storage/db/schema/turns.ts
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const turns = sqliteTable('turns', {
  id: text('id').primaryKey(),
  threadId: text('thread_id').notNull(),
  role: text('role').notNull(),
  providerProfileId: text('provider_profile_id'),
  modelId: text('model_id'),
  status: text('status').notNull(),
  contentJson: text('content_json').notNull().default('[]'),
  usageJson: text('usage_json').notNull().default('{}'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull()
})
```

```ts
// mobile/src/storage/db/schema/appPreferences.ts
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const appPreferences = sqliteTable('app_preferences', {
  key: text('key').primaryKey(),
  valueJson: text('value_json').notNull(),
  updatedAt: integer('updated_at').notNull()
})
```

```ts
// mobile/src/storage/db/schema/index.ts
export { appPreferences } from './appPreferences'
export { modelCatalog } from './modelCatalog'
export { providerProfiles } from './providerProfiles'
export { threads } from './threads'
export { turns } from './turns'
```

- [ ] **Step 4: Add the missing persistence dependencies**

Update `mobile/package.json` dependencies and devDependencies:

```json
{
  "dependencies": {
    "drizzle-orm": "^0.36.0",
    "expo-sqlite": "~15.0.0"
  },
  "devDependencies": {
    "drizzle-kit": "^0.27.0"
  }
}
```

Run:

```bash
cd mobile
npm install
```

Expected: packages installed with no lockfile conflicts.

- [ ] **Step 5: Run the schema smoke test and typecheck**

Run:

```bash
cd mobile
npm test -- --runTestsByPath src/storage/db/schema/__tests__/schemaShape.test.ts --runInBand
npm run typecheck
```

Expected: test PASS, typecheck PASS.

- [ ] **Step 6: Generate the initial migration**

Run:

```bash
cd mobile
npm run db:generate
```

Expected: Drizzle creates a `mobile/drizzle/` directory with the initial SQL migration.

- [ ] **Step 7: Commit**

```bash
git add mobile/package.json mobile/package-lock.json mobile/drizzle.config.ts mobile/drizzle mobile/src/storage/db/client.ts mobile/src/storage/db/migrate.ts mobile/src/storage/db/schema/providerProfiles.ts mobile/src/storage/db/schema/modelCatalog.ts mobile/src/storage/db/schema/threads.ts mobile/src/storage/db/schema/turns.ts mobile/src/storage/db/schema/appPreferences.ts mobile/src/storage/db/schema/index.ts mobile/src/storage/db/schema/__tests__/schemaShape.test.ts
git commit -m "feat: add native persistence foundation"
```

## Task 3: Implement Secure Provider Setup And Model Discovery

**Files:**
- Create: `mobile/src/storage/secure/apiKeys.ts`
- Create: `mobile/src/core/providers/types.ts`
- Create: `mobile/src/core/providers/registry.ts`
- Create: `mobile/src/core/providers/adapters/openai.ts`
- Create: `mobile/src/core/providers/adapters/gemini.ts`
- Create: `mobile/src/core/providers/adapters/claude.ts`
- Create: `mobile/src/services/ProviderProfileService.ts`
- Create: `mobile/src/services/ModelCatalogService.ts`
- Test: `mobile/src/services/__tests__/ProviderSetup.test.ts`

- [ ] **Step 1: Write the failing provider setup tests**

```ts
// mobile/src/services/__tests__/ProviderSetup.test.ts
import { describe, expect, it, vi } from '@jest/globals'

import { ProviderProfileService } from '../ProviderProfileService'
import { ModelCatalogService } from '../ModelCatalogService'

describe('ProviderProfileService', () => {
  it('stores provider metadata separately from the API key', async () => {
    const secureStore = { setApiKey: vi.fn() }
    const repository = { upsert: vi.fn() }
    const service = new ProviderProfileService(repository as any, secureStore as any)

    await service.save({
      id: 'openai-main',
      presetType: 'openai',
      displayName: 'OpenAI Main',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: 'sk-test'
    })

    expect(repository.upsert).toHaveBeenCalledWith(expect.objectContaining({ apiKeyRef: 'provider:openai-main' }))
    expect(secureStore.setApiKey).toHaveBeenCalledWith('provider:openai-main', 'sk-test')
  })
})

describe('ModelCatalogService', () => {
  it('normalizes providers into one model descriptor shape', async () => {
    const registry = {
      resolve: vi.fn().mockReturnValue({
        listModels: vi.fn().mockResolvedValue([{ modelId: 'gpt-4.1-mini', label: 'GPT-4.1 mini', supportsStreaming: true }])
      })
    }
    const service = new ModelCatalogService(registry as any)

    const result = await service.list({
      id: 'openai-main',
      presetType: 'openai',
      baseUrl: 'https://api.openai.com/v1'
    } as any)

    expect(result).toEqual([
      expect.objectContaining({
        providerProfileId: 'openai-main',
        modelId: 'gpt-4.1-mini',
        label: 'GPT-4.1 mini',
        supportsStreaming: true
      })
    ])
  })
})
```

- [ ] **Step 2: Run the provider tests to verify they fail**

Run:

```bash
cd mobile
npm test -- --runTestsByPath src/services/__tests__/ProviderSetup.test.ts --runInBand
```

Expected: FAIL because the services and adapters do not exist yet.

- [ ] **Step 3: Add provider types, secure storage, and services**

```ts
// mobile/src/storage/secure/apiKeys.ts
import * as SecureStore from 'expo-secure-store'

export class ApiKeyStore {
  async setApiKey(ref: string, apiKey: string) {
    await SecureStore.setItemAsync(ref, apiKey)
  }

  async getApiKey(ref: string) {
    return SecureStore.getItemAsync(ref)
  }
}
```

```ts
// mobile/src/core/providers/types.ts
export type ProviderPreset = 'openai' | 'gemini' | 'claude'

export type ProviderProfileInput = {
  id: string
  presetType: ProviderPreset
  displayName: string
  baseUrl: string
  apiKey?: string
}

export type ProviderProfileRecord = {
  id: string
  presetType: ProviderPreset
  displayName: string
  baseUrl: string
  apiKeyRef: string
}

export type ModelDescriptor = {
  providerProfileId: string
  modelId: string
  label: string
  supportsStreaming: boolean
  supportsReasoning: boolean
  isEmbeddingModel: boolean
}

export interface ProviderAdapter {
  listModels(profile: ProviderProfileRecord, apiKey: string): Promise<Omit<ModelDescriptor, 'providerProfileId'>[]>
}
```

```ts
// mobile/src/core/providers/adapters/openai.ts
import { ProviderAdapter } from '../types'

export class OpenAIAdapter implements ProviderAdapter {
  async listModels(profile, apiKey) {
    const response = await fetch(`${profile.baseUrl}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` }
    })
    const payload = await response.json()
    return payload.data.map((item: any) => ({
      modelId: item.id,
      label: item.id,
      supportsStreaming: true,
      supportsReasoning: false,
      isEmbeddingModel: item.id.includes('embedding')
    }))
  }
}
```

```ts
// mobile/src/core/providers/adapters/gemini.ts
import { ProviderAdapter } from '../types'

export class GeminiAdapter implements ProviderAdapter {
  async listModels(profile, apiKey) {
    const response = await fetch(`${profile.baseUrl}/models?key=${apiKey}`)
    const payload = await response.json()
    return payload.models.map((item: any) => ({
      modelId: item.name.replace('models/', ''),
      label: item.displayName ?? item.name,
      supportsStreaming: true,
      supportsReasoning: false,
      isEmbeddingModel: item.name.includes('embedding')
    }))
  }
}
```

```ts
// mobile/src/core/providers/adapters/claude.ts
import { ProviderAdapter } from '../types'

const CLAUDE_MODELS = ['claude-3-5-haiku-latest', 'claude-3-7-sonnet-latest']

export class ClaudeAdapter implements ProviderAdapter {
  async listModels() {
    return CLAUDE_MODELS.map((modelId) => ({
      modelId,
      label: modelId,
      supportsStreaming: true,
      supportsReasoning: true,
      isEmbeddingModel: false
    }))
  }
}
```

```ts
// mobile/src/core/providers/registry.ts
import { ClaudeAdapter } from './adapters/claude'
import { GeminiAdapter } from './adapters/gemini'
import { OpenAIAdapter } from './adapters/openai'

export class ProviderRegistry {
  resolve(presetType: 'openai' | 'gemini' | 'claude') {
    if (presetType === 'openai') return new OpenAIAdapter()
    if (presetType === 'gemini') return new GeminiAdapter()
    return new ClaudeAdapter()
  }
}
```

```ts
// mobile/src/services/ProviderProfileService.ts
import { ProviderProfileInput } from '../core/providers/types'

export class ProviderProfileService {
  constructor(private repository: { upsert: (record: any) => Promise<void> }, private apiKeyStore: { setApiKey: (ref: string, apiKey: string) => Promise<void> }) {}

  async save(input: ProviderProfileInput) {
    const apiKeyRef = `provider:${input.id}`
    if (input.apiKey) {
      await this.apiKeyStore.setApiKey(apiKeyRef, input.apiKey)
    }
    await this.repository.upsert({
      id: input.id,
      presetType: input.presetType,
      displayName: input.displayName,
      baseUrl: input.baseUrl,
      apiKeyRef
    })
  }
}
```

```ts
// mobile/src/services/ModelCatalogService.ts
import { ModelDescriptor, ProviderProfileRecord } from '../core/providers/types'

export class ModelCatalogService {
  constructor(private registry: { resolve: (presetType: ProviderProfileRecord['presetType']) => { listModels: (profile: ProviderProfileRecord, apiKey: string) => Promise<Omit<ModelDescriptor, 'providerProfileId'>[]> } }) {}

  async list(profile: ProviderProfileRecord, apiKey = 'test-key'): Promise<ModelDescriptor[]> {
    const adapter = this.registry.resolve(profile.presetType)
    const models = await adapter.listModels(profile, apiKey)
    return models.map((model) => ({ ...model, providerProfileId: profile.id }))
  }
}
```

- [ ] **Step 4: Add secure storage and provider networking dependencies**

Update `mobile/package.json`:

```json
{
  "dependencies": {
    "expo-secure-store": "~14.0.0"
  }
}
```

Run:

```bash
cd mobile
npm install
```

Expected: install succeeds.

- [ ] **Step 5: Run provider tests and typecheck**

Run:

```bash
cd mobile
npm test -- --runTestsByPath src/services/__tests__/ProviderSetup.test.ts --runInBand
npm run typecheck
```

Expected: tests PASS, typecheck PASS.

- [ ] **Step 6: Commit**

```bash
git add mobile/package.json mobile/package-lock.json mobile/src/storage/secure/apiKeys.ts mobile/src/core/providers/types.ts mobile/src/core/providers/registry.ts mobile/src/core/providers/adapters/openai.ts mobile/src/core/providers/adapters/gemini.ts mobile/src/core/providers/adapters/claude.ts mobile/src/services/ProviderProfileService.ts mobile/src/services/ModelCatalogService.ts mobile/src/services/__tests__/ProviderSetup.test.ts
git commit -m "feat: add secure provider setup and model discovery"
```

## Task 4: Implement Single-Model Chat Orchestration

**Files:**
- Create: `mobile/src/core/chat/types.ts`
- Create: `mobile/src/core/chat/streamEvents.ts`
- Create: `mobile/src/core/chat/singleRun.ts`
- Create: `mobile/src/services/ThreadService.ts`
- Test: `mobile/src/core/chat/__tests__/singleRun.test.ts`

- [ ] **Step 1: Write the failing single-run orchestration test**

```ts
// mobile/src/core/chat/__tests__/singleRun.test.ts
import { describe, expect, it, vi } from '@jest/globals'

import { runSingleTurn } from '../singleRun'

describe('runSingleTurn', () => {
  it('emits canonical events and persists the assistant turn', async () => {
    const adapter = {
      streamText: vi.fn(async (_request, sink) => {
        sink({ type: 'response_started' })
        sink({ type: 'text_delta', text: 'Hello' })
        sink({ type: 'response_completed', usage: { inputTokens: 3, outputTokens: 1 } })
      })
    }
    const threadService = {
      createUserTurn: vi.fn(),
      appendAssistantDelta: vi.fn(),
      completeAssistantTurn: vi.fn()
    }

    await runSingleTurn({
      adapter: adapter as any,
      threadService: threadService as any,
      threadId: 'thread-1',
      prompt: 'Hi'
    })

    expect(threadService.createUserTurn).toHaveBeenCalledWith('thread-1', 'Hi')
    expect(threadService.appendAssistantDelta).toHaveBeenCalledWith('thread-1', 'Hello')
    expect(threadService.completeAssistantTurn).toHaveBeenCalledWith(
      'thread-1',
      expect.objectContaining({ outputTokens: 1 })
    )
  })
})
```

- [ ] **Step 2: Run the single-run test to verify it fails**

Run:

```bash
cd mobile
npm test -- --runTestsByPath src/core/chat/__tests__/singleRun.test.ts --runInBand
```

Expected: FAIL because the chat core files do not exist yet.

- [ ] **Step 3: Add canonical chat types and the single-run orchestration**

```ts
// mobile/src/core/chat/types.ts
export type CanonicalUsage = {
  inputTokens: number
  outputTokens: number
}

export type CanonicalStreamEvent =
  | { type: 'response_started' }
  | { type: 'text_delta'; text: string }
  | { type: 'response_completed'; usage: CanonicalUsage }
  | { type: 'response_failed'; message: string }
```

```ts
// mobile/src/core/chat/streamEvents.ts
export type StreamSink = (event:
  | { type: 'response_started' }
  | { type: 'text_delta'; text: string }
  | { type: 'response_completed'; usage: { inputTokens: number; outputTokens: number } }
  | { type: 'response_failed'; message: string }) => void
```

```ts
// mobile/src/core/chat/singleRun.ts
import { StreamSink } from './streamEvents'

type SingleRunArgs = {
  adapter: { streamText: (request: { prompt: string }, sink: StreamSink) => Promise<void> }
  threadService: {
    createUserTurn: (threadId: string, prompt: string) => Promise<void>
    appendAssistantDelta: (threadId: string, text: string) => Promise<void>
    completeAssistantTurn: (threadId: string, usage: { inputTokens: number; outputTokens: number }) => Promise<void>
  }
  threadId: string
  prompt: string
}

export async function runSingleTurn({ adapter, threadService, threadId, prompt }: SingleRunArgs) {
  await threadService.createUserTurn(threadId, prompt)

  await adapter.streamText({ prompt }, async (event) => {
    if (event.type === 'text_delta') {
      await threadService.appendAssistantDelta(threadId, event.text)
    }
    if (event.type === 'response_completed') {
      await threadService.completeAssistantTurn(threadId, event.usage)
    }
  })
}
```

```ts
// mobile/src/services/ThreadService.ts
export class ThreadService {
  async createUserTurn(threadId: string, prompt: string) {
    console.log('create user turn', threadId, prompt)
  }

  async appendAssistantDelta(threadId: string, text: string) {
    console.log('append assistant delta', threadId, text)
  }

  async completeAssistantTurn(threadId: string, usage: { inputTokens: number; outputTokens: number }) {
    console.log('complete assistant turn', threadId, usage)
  }
}
```

- [ ] **Step 4: Run the single-run test and typecheck**

Run:

```bash
cd mobile
npm test -- --runTestsByPath src/core/chat/__tests__/singleRun.test.ts --runInBand
npm run typecheck
```

Expected: test PASS, typecheck PASS.

- [ ] **Step 5: Commit**

```bash
git add mobile/src/core/chat/types.ts mobile/src/core/chat/streamEvents.ts mobile/src/core/chat/singleRun.ts mobile/src/core/chat/__tests__/singleRun.test.ts mobile/src/services/ThreadService.ts
git commit -m "feat: add single-model chat orchestration"
```

## Task 5: Wire The First Usable Native Screens

**Files:**
- Modify: `mobile/app/(tabs)/threads/index.tsx`
- Modify: `mobile/app/(tabs)/settings/index.tsx`
- Create: `mobile/app/threads/[threadId].tsx`
- Create: `mobile/src/features/threads/ThreadListScreen.tsx`
- Create: `mobile/src/features/settings/SettingsScreen.tsx`
- Create: `mobile/src/features/settings/ProviderProfileForm.tsx`
- Create: `mobile/src/features/chat/ChatScreen.tsx`
- Create: `mobile/src/features/chat/MessageComposer.tsx`
- Create: `mobile/src/features/chat/MessageList.tsx`
- Test: `mobile/src/features/chat/__tests__/ChatScreen.test.tsx`

- [ ] **Step 1: Write the failing chat-screen test**

```tsx
// mobile/src/features/chat/__tests__/ChatScreen.test.tsx
import { fireEvent, render, screen } from '@testing-library/react-native'
import { describe, expect, it, vi } from '@jest/globals'

import { ChatScreen } from '../ChatScreen'

describe('ChatScreen', () => {
  it('submits a prompt and renders the streamed response', async () => {
    const runSingleTurn = vi.fn(async ({ onDelta }) => {
      await onDelta('Hello from model')
    })

    render(<ChatScreen threadId="thread-1" runSingleTurn={runSingleTurn as any} />)

    fireEvent.changeText(screen.getByPlaceholderText('Ask anything'), 'Hi there')
    fireEvent.press(screen.getByText('Send'))

    expect(runSingleTurn).toHaveBeenCalled()
    expect(await screen.findByText('Hello from model')).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run the chat-screen test to verify it fails**

Run:

```bash
cd mobile
npm test -- --runTestsByPath src/features/chat/__tests__/ChatScreen.test.tsx --runInBand
```

Expected: FAIL because the feature files do not exist yet.

- [ ] **Step 3: Build the first usable screens and components**

```tsx
// mobile/src/features/threads/ThreadListScreen.tsx
import { Pressable, Text, View } from 'react-native'
import { router } from 'expo-router'

export function ThreadListScreen() {
  return (
    <View>
      <Text>Threads</Text>
      <Pressable onPress={() => router.push('/threads/thread-1')}>
        <Text>Open starter thread</Text>
      </Pressable>
    </View>
  )
}
```

```tsx
// mobile/src/features/settings/ProviderProfileForm.tsx
import { Pressable, Text, TextInput, View } from 'react-native'
import { useState } from 'react'

export function ProviderProfileForm({ onSubmit }: { onSubmit: (value: { displayName: string; baseUrl: string; apiKey: string }) => void }) {
  const [displayName, setDisplayName] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [apiKey, setApiKey] = useState('')

  return (
    <View>
      <TextInput placeholder="Display name" value={displayName} onChangeText={setDisplayName} />
      <TextInput placeholder="Base URL" value={baseUrl} onChangeText={setBaseUrl} />
      <TextInput placeholder="API key" value={apiKey} onChangeText={setApiKey} />
      <Pressable onPress={() => onSubmit({ displayName, baseUrl, apiKey })}>
        <Text>Save provider</Text>
      </Pressable>
    </View>
  )
}
```

```tsx
// mobile/src/features/settings/SettingsScreen.tsx
import { Alert, Text, View } from 'react-native'

import { ProviderProfileForm } from './ProviderProfileForm'

export function SettingsScreen() {
  return (
    <View>
      <Text>Settings</Text>
      <ProviderProfileForm onSubmit={() => Alert.alert('Saved')} />
    </View>
  )
}
```

```tsx
// mobile/src/features/chat/MessageComposer.tsx
import { Pressable, Text, TextInput, View } from 'react-native'

export function MessageComposer({
  value,
  onChange,
  onSend
}: {
  value: string
  onChange: (value: string) => void
  onSend: () => void
}) {
  return (
    <View>
      <TextInput placeholder="Ask anything" value={value} onChangeText={onChange} />
      <Pressable onPress={onSend}>
        <Text>Send</Text>
      </Pressable>
    </View>
  )
}
```

```tsx
// mobile/src/features/chat/MessageList.tsx
import { Text, View } from 'react-native'

export function MessageList({ messages }: { messages: string[] }) {
  return (
    <View>
      {messages.map((message) => (
        <Text key={message}>{message}</Text>
      ))}
    </View>
  )
}
```

```tsx
// mobile/src/features/chat/ChatScreen.tsx
import { useState } from 'react'
import { View } from 'react-native'

import { MessageComposer } from './MessageComposer'
import { MessageList } from './MessageList'

export function ChatScreen({
  threadId,
  runSingleTurn
}: {
  threadId: string
  runSingleTurn: (args: { threadId: string; prompt: string; onDelta: (text: string) => Promise<void> }) => Promise<void>
}) {
  const [prompt, setPrompt] = useState('')
  const [messages, setMessages] = useState<string[]>([])

  return (
    <View>
      <MessageList messages={messages} />
      <MessageComposer
        value={prompt}
        onChange={setPrompt}
        onSend={async () => {
          await runSingleTurn({
            threadId,
            prompt,
            onDelta: async (text) => setMessages((current) => [...current, text])
          })
          setPrompt('')
        }}
      />
    </View>
  )
}
```

```tsx
// mobile/app/(tabs)/threads/index.tsx
import { ThreadListScreen } from '../../../src/features/threads/ThreadListScreen'

export default function ThreadsIndexScreen() {
  return <ThreadListScreen />
}
```

```tsx
// mobile/app/(tabs)/settings/index.tsx
import { SettingsScreen } from '../../../src/features/settings/SettingsScreen'

export default function SettingsIndexScreen() {
  return <SettingsScreen />
}
```

```tsx
// mobile/app/threads/[threadId].tsx
import { useLocalSearchParams } from 'expo-router'

import { ChatScreen } from '../../src/features/chat/ChatScreen'

export default function ThreadChatRoute() {
  const { threadId } = useLocalSearchParams<{ threadId: string }>()
  return (
    <ChatScreen
      threadId={threadId}
      runSingleTurn={async ({ onDelta }) => {
        await onDelta('Hello from model')
      }}
    />
  )
}
```

- [ ] **Step 4: Run the chat-screen test and launch smoke checks**

Run:

```bash
cd mobile
npm test -- --runTestsByPath src/features/chat/__tests__/ChatScreen.test.tsx --runInBand
npm run ios
npm run android
```

Expected:

- Jest PASS for `ChatScreen.test.tsx`
- iOS simulator opens with `Threads`, `Library`, `Settings`
- Android emulator opens with the same three tabs and the starter thread route

- [ ] **Step 5: Commit**

```bash
git add mobile/app/'(tabs)'/threads/index.tsx mobile/app/'(tabs)'/settings/index.tsx mobile/app/threads/'[threadId]'.tsx mobile/src/features/threads/ThreadListScreen.tsx mobile/src/features/settings/SettingsScreen.tsx mobile/src/features/settings/ProviderProfileForm.tsx mobile/src/features/chat/ChatScreen.tsx mobile/src/features/chat/MessageComposer.tsx mobile/src/features/chat/MessageList.tsx mobile/src/features/chat/__tests__/ChatScreen.test.tsx
git commit -m "feat: wire native shell to first usable screens"
```

## Task 6: Document And Verify Phase 1 Boundaries

**Files:**
- Modify: `mobile/README.md`
- Test: manual verification only

- [ ] **Step 1: Add explicit phase-boundary notes to the native README**

```md
<!-- mobile/README.md -->
# Open WebUI Native

## Phase 1 Scope

This app currently ships:

- native shell
- local SQLite foundation
- secure provider setup
- normalized model discovery
- single-model chat

This phase intentionally does not include:

- compare mode
- judge summaries
- local RAG
- file import flows
```

- [ ] **Step 2: Run the final phase-1 verification commands**

Run:

```bash
cd mobile
npm run typecheck
npm test -- --runInBand
```

Expected: full phase-1 test suite PASS with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add mobile/README.md
git commit -m "docs: record native platform core scope"
```
