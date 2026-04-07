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
