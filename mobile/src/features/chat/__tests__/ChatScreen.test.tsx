import { fireEvent, render, screen } from '@testing-library/react-native'
import { describe, expect, it, jest } from '@jest/globals'

import { ChatScreen } from '../ChatScreen'

describe('ChatScreen', () => {
  it('submits a prompt and renders the streamed response', async () => {
    const runSingleTurn = jest.fn(async ({ onDelta }: { onDelta: (text: string) => Promise<void> }) => {
      await onDelta('Hello from model')
    })

    render(<ChatScreen threadId="thread-1" runSingleTurn={runSingleTurn as any} />)

    fireEvent.changeText(screen.getByPlaceholderText('Ask anything'), 'Hi there')
    fireEvent.press(screen.getByText('Send'))

    expect(runSingleTurn).toHaveBeenCalled()
    expect(await screen.findByText('Hello from model')).toBeTruthy()
  })
})
