import { fireEvent, render, screen } from '@testing-library/react-native'
import { describe, expect, it, jest } from '@jest/globals'

import { CompareRunCard } from '../CompareRunCard'

describe('CompareRunCard', () => {
  it('renders judge summary and switches between branch tabs', async () => {
    render(
      <CompareRunCard
        run={{
          id: 'compare-1',
          kind: 'compare_run',
          promptTurnId: 'turn-user-1',
          status: 'completed',
          judgeSummary: 'Candidate 2 is more complete.',
          branches: [
            {
              id: 'branch-1',
              providerProfileId: 'openai-main',
              modelId: 'gpt-4.1',
              status: 'completed',
              text: 'Answer A',
              usageJson: '{}',
              latencyMs: 120,
              errorJson: '{}',
              continuationThreadId: null
            },
            {
              id: 'branch-2',
              providerProfileId: 'claude-main',
              modelId: 'claude-3-7-sonnet',
              status: 'completed',
              text: 'Answer B',
              usageJson: '{}',
              latencyMs: 140,
              errorJson: '{}',
              continuationThreadId: null
            }
          ]
        }}
      />
    )

    expect(screen.getByText('Candidate 2 is more complete.')).toBeTruthy()
    expect(screen.getByText('Answer A')).toBeTruthy()

    fireEvent.press(screen.getByText('claude-3-7-sonnet'))

    expect(await screen.findByText('Answer B')).toBeTruthy()
  })

  it('renders branch actions and forwards the selected branch callbacks', () => {
    const onContinueBranch = jest.fn()
    const onCopyBranch = jest.fn()
    const onExportRun = jest.fn()

    render(
      <CompareRunCard
        run={{
          id: 'compare-1',
          kind: 'compare_run',
          promptTurnId: 'turn-user-1',
          status: 'completed',
          judgeSummary: null,
          branches: [
            {
              id: 'branch-1',
              providerProfileId: 'openai-main',
              modelId: 'gpt-4.1',
              status: 'completed',
              text: 'Answer A',
              usageJson: '{}',
              latencyMs: 120,
              errorJson: '{}',
              continuationThreadId: null
            }
          ]
        }}
        onContinueBranch={onContinueBranch}
        onCopyBranch={onCopyBranch}
        onExportRun={onExportRun}
      />
    )

    fireEvent.press(screen.getByText('Continue'))
    fireEvent.press(screen.getByText('Copy'))
    fireEvent.press(screen.getByText('Export'))

    expect(onContinueBranch).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'branch-1',
        modelId: 'gpt-4.1'
      })
    )
    expect(onCopyBranch).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'branch-1',
        text: 'Answer A'
      })
    )
    expect(onExportRun).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'compare-1'
      })
    )
  })
})
