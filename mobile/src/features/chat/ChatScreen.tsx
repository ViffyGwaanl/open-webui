import { Alert, useWindowDimensions } from 'react-native'
import { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'

import type { RetrievalContext } from '../../core/rag/types'
import type { ThreadTimelineItem } from '../../services/ThreadService'
import { AdaptivePane } from '../../ui/layout/AdaptivePane'
import type { WorkspaceLayout } from '../../ui/layout/useWorkspaceLayout'
import { getWorkspaceLayout } from '../../ui/layout/useWorkspaceLayout'
import { MessageComposer } from './MessageComposer'
import { MessageList } from './MessageList'
import { RagContextSheet } from './RagContextSheet'
import { RagEvidenceBadge } from './RagEvidenceBadge'

type ChatScreenProps = {
  threadId: string
  runSingleTurn: (args: {
    threadId: string
    prompt: string
    onDelta: (text: string) => Promise<void>
  }) => Promise<void>
  runSingleTurnWithRag?: (args: {
    threadId: string
    prompt: string
  }) => Promise<RetrievalContext>
  runCompareTurn?: (args: { threadId: string; prompt: string }) => Promise<void>
  loadTimeline?: (threadId: string) => Promise<ThreadTimelineItem[]>
  layout?: WorkspaceLayout
}

export function ChatScreen({
  threadId,
  runSingleTurn,
  runSingleTurnWithRag,
  runCompareTurn,
  loadTimeline,
  layout: explicitLayout
}: ChatScreenProps) {
  const windowDimensions = useWindowDimensions()
  const layout = explicitLayout ?? getWorkspaceLayout(windowDimensions)
  const [prompt, setPrompt] = useState('')
  const [mode, setMode] = useState<'single' | 'compare' | 'rag'>('single')
  const [items, setItems] = useState<ThreadTimelineItem[]>([])
  const [lastRagContext, setLastRagContext] = useState<RetrievalContext | null>(null)

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
      <AdaptivePane
        layout={layout}
        primary={
          <View style={styles.primaryPane}>
            <MessageList items={items} />
            {lastRagContext ? <RagEvidenceBadge context={lastRagContext} /> : null}
            {lastRagContext ? <RagContextSheet context={lastRagContext} /> : null}
            <MessageComposer
              value={prompt}
              onChange={setPrompt}
              mode={mode}
              onModeChange={setMode}
              canCompare={Boolean(runCompareTurn)}
              canUseRag={Boolean(runSingleTurnWithRag)}
              onSend={async () => {
                try {
                  if (mode === 'compare' && runCompareTurn) {
                    setLastRagContext(null)
                    await runCompareTurn({
                      threadId,
                      prompt
                    })
                    await refreshTimeline()
                  } else if (mode === 'rag' && runSingleTurnWithRag) {
                    const context = await runSingleTurnWithRag({
                      threadId,
                      prompt
                    })
                    setLastRagContext(context)
                    await refreshTimeline()
                  } else {
                    setLastRagContext(null)
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
                } catch (error) {
                  Alert.alert('Request failed', error instanceof Error ? error.message : 'Unknown error')
                }
              }}
            />
          </View>
        }
        secondary={
          layout === 'tablet' ? <View testID="chat-secondary-pane" style={styles.secondaryPane} /> : null
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 16
  },
  primaryPane: {
    flex: 1,
    gap: 16
  },
  secondaryPane: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: '#f8fafc'
  }
})
