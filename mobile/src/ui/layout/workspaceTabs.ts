export type WorkspaceTab = {
  readonly name: 'threads/index' | 'library/index' | 'settings/index'
  readonly title: 'Threads' | 'Library' | 'Settings'
}

export const WORKSPACE_TABS = [
  { name: 'threads/index', title: 'Threads' },
  { name: 'library/index', title: 'Library' },
  { name: 'settings/index', title: 'Settings' }
] as const satisfies readonly WorkspaceTab[]
