import { describe, expect, it } from '@jest/globals'

import { getWorkspaceLayout } from '../useWorkspaceLayout'

describe('getWorkspaceLayout', () => {
  it('returns tablet when width is large enough for a two-pane workspace', () => {
    expect(getWorkspaceLayout({ width: 1024, height: 1366 })).toBe('tablet')
  })

  it('returns phone for smaller widths', () => {
    expect(getWorkspaceLayout({ width: 430, height: 932 })).toBe('phone')
  })
})
