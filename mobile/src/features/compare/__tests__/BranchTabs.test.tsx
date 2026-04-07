import { fireEvent, render, screen } from '@testing-library/react-native'
import { describe, expect, it, jest } from '@jest/globals'

import { BranchTabs } from '../BranchTabs'

describe('BranchTabs', () => {
  it('renders branch labels and forwards tab selection', () => {
    const onSelect = jest.fn()

    render(
      <BranchTabs
        branches={[
          {
            id: 'branch-1',
            modelId: 'gpt-4.1',
            status: 'completed'
          },
          {
            id: 'branch-2',
            modelId: 'claude-3.7-sonnet',
            status: 'streaming'
          }
        ]}
        selectedBranchId="branch-1"
        onSelect={onSelect}
      />
    )

    expect(screen.getByText('gpt-4.1')).toBeTruthy()
    expect(screen.getByText('claude-3.7-sonnet')).toBeTruthy()

    fireEvent.press(screen.getByText('claude-3.7-sonnet'))

    expect(onSelect).toHaveBeenCalledWith('branch-2')
  })
})
