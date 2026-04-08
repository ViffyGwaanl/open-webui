import { WORKSPACE_TABS } from '../../ui/layout/workspaceTabs'

describe('WORKSPACE_TABS', () => {
  it('defines the three top-level workspaces in launch order', () => {
    expect(WORKSPACE_TABS).toEqual([
      { name: 'threads/index', title: 'Threads' },
      { name: 'library/index', title: 'Library' },
      { name: 'settings/index', title: 'Settings' }
    ])
  })
})
