import { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'

import type { ThreadTimelineItem } from '../../services/ThreadService'
import { MessageComposer } from './MessageComposer'
import { MessageList } from './MessageList'

type ChatScreenProps = {
  threadId: string
  runSingleTurn: (args: {
    threadId: string
    prompt: string
    onDelta: (text: string) => Promise<void>
  }) => Promise<void>
  runCompareTurn?: (args: { threadId: string; prompt: string }) => Promise<void>
  loadTimeline?: (threadId: string) => Promise<ThreadTimelineItem[]>
}

export function ChatScreen({
  threadId,
  runSingleTurn,
  runCompareTurn,
  loadTimeline
}: ChatScreenProps) {
  const [prompt, setPrompt] = useState('')
  const [mode, setMode] = useState<'single' | 'compare'>('single')
  const [items, setItems] = useState<ThreadTimelineItem[]>([])

  const refreshTimeline = async () => {
    if (!loadTimeline) {
      return
    }

    setItems(await loadTimeline(threadId))
  }

  useEffect(() => {
    void refreshTimeline()
  }, [threadId, loadTimeline])

  return (
    <View style={styles.container}>
      <MessageList items={items} />
      <MessageComposer
        value={prompt}
        onChange={setPrompt}
        mode={mode}
        onModeChange={setMode}
        canCompare={Boolean(runCompareTurn)}
        onSend={async () => {
          if (mode === 'compare' && runCompareTurn) {
            await runCompareTurn({
              threadId,
              prompt
            })
            await refreshTimeline()
          } else {
            await runSingleTurn({
              threadId,
              prompt,
              onDelta: async (text) => {
                setItems((current) => [
                  ...current,
                  {
                    id: `local-turn-${current.length + 1}`,
                    kind: 'turn',
                    role: 'assistant',
                    status: 'streaming',
                    text,
                    providerProfileId: null,
                    modelId: null
                  }
                ])
              }
            })
            await refreshTimeline()
          }
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
