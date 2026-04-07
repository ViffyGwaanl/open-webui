import { render, screen } from '@testing-library/react-native'
import { describe, expect, it } from '@jest/globals'

import { ChatScreen } from '../ChatScreen'

describe('ChatScreen layout', () => {
  it('renders the secondary pane when tablet layout is active', () => {
    render(
      <ChatScreen
        threadId="thread-1"
        runSingleTurn={async () => {}}
        layout="tablet"
      />
    )

    expect(screen.getByTestId('chat-secondary-pane')).toBeTruthy()
  })
})
