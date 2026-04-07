import { fireEvent, render, screen } from '@testing-library/react-native'
import { describe, expect, it } from '@jest/globals'

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
              errorJson: '{}'
            },
            {
              id: 'branch-2',
              providerProfileId: 'claude-main',
              modelId: 'claude-3-7-sonnet',
              status: 'completed',
              text: 'Answer B',
              usageJson: '{}',
              latencyMs: 140,
              errorJson: '{}'
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
})
