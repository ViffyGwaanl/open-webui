import { useState } from 'react'
import { StyleSheet, View } from 'react-native'

import { MessageComposer } from './MessageComposer'
import { MessageList } from './MessageList'

type ChatScreenProps = {
  threadId: string
  runSingleTurn: (args: {
    threadId: string
    prompt: string
    onDelta: (text: string) => Promise<void>
  }) => Promise<void>
}

export function ChatScreen({ threadId, runSingleTurn }: ChatScreenProps) {
  const [prompt, setPrompt] = useState('')
  const [messages, setMessages] = useState<string[]>([])

  return (
    <View style={styles.container}>
      <MessageList messages={messages} />
      <MessageComposer
        value={prompt}
        onChange={setPrompt}
        onSend={async () => {
          await runSingleTurn({
            threadId,
            prompt,
            onDelta: async (text) => {
              setMessages((current) => [...current, text])
            }
          })
          setPrompt('')
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 16
  }
})
