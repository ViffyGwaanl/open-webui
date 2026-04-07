export type WorkspaceTab = {
  readonly name: 'threads' | 'library' | 'settings'
  readonly title: 'Threads' | 'Library' | 'Settings'
}

export const WORKSPACE_TABS = [
  { name: 'threads', title: 'Threads' },
  { name: 'library', title: 'Library' },
  { name: 'settings', title: 'Settings' }
] as const satisfies readonly WorkspaceTab[]
