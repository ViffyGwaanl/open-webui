import { fireEvent, render, screen } from '@testing-library/react-native'
import { describe, expect, it, jest } from '@jest/globals'

import { ChatScreen } from '../ChatScreen'

describe('ChatScreen rag mode', () => {
  it('runs a RAG turn and surfaces the retrieved evidence summary', async () => {
    const runSingleTurnWithRag = jest.fn(async () => ({
      snippets: [
        {
          id: 'chunk-1',
          documentId: 'doc-1',
          sourceLabel: 'guide.md',
          snippetText: 'Architecture note',
          sectionTitle: 'Intro',
          pageNumber: null
        }
      ]
    }))

    render(
      <ChatScreen
        threadId="thread-1"
        runSingleTurn={async () => {}}
        runSingleTurnWithRag={runSingleTurnWithRag as never}
      />
    )

    fireEvent.press(screen.getByText('RAG'))
    fireEvent.changeText(screen.getByPlaceholderText('Ask anything'), 'Summarize the guide')
    fireEvent.press(screen.getByText('Send'))

    expect(runSingleTurnWithRag).toHaveBeenCalledWith({
      threadId: 'thread-1',
      prompt: 'Summarize the guide'
    })
    expect(await screen.findByText('1 source attached')).toBeTruthy()
    expect(await screen.findByText('guide.md')).toBeTruthy()
  })
})
