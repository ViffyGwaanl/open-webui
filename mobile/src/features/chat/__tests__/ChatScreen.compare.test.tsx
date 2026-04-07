import { fireEvent, render, screen } from '@testing-library/react-native'
import { describe, expect, it, jest } from '@jest/globals'

import { ChatScreen } from '../ChatScreen'

describe('ChatScreen compare mode', () => {
  it('submits a compare run and refreshes the timeline with the compare card', async () => {
    const runCompareTurn = jest.fn(async () => {})
    const loadTimeline = jest
      .fn<() => Promise<any[]>>()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: 'compare-1',
          kind: 'compare_run',
          promptTurnId: 'turn-user-1',
          status: 'partial',
          judgeSummary: 'Candidate 1 wins.',
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
            }
          ]
        }
      ])

    render(
      <ChatScreen
        threadId="thread-1"
        runSingleTurn={async () => {}}
        runCompareTurn={runCompareTurn}
        loadTimeline={loadTimeline as never}
      />
    )

    fireEvent.press(screen.getByText('Compare'))
    fireEvent.changeText(screen.getByPlaceholderText('Ask anything'), 'Compare this design')
    fireEvent.press(screen.getByText('Send'))

    expect(runCompareTurn).toHaveBeenCalledWith({
      threadId: 'thread-1',
      prompt: 'Compare this design'
    })
    expect(await screen.findByText('Candidate 1 wins.')).toBeTruthy()
    expect(await screen.findByText('Answer A')).toBeTruthy()
  })
})
