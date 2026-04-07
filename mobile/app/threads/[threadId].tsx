import * as Clipboard from 'expo-clipboard'
import { router, useLocalSearchParams } from 'expo-router'
import { Alert, Share } from 'react-native'
import { useEffect, useState } from 'react'

import { exportCompareRunMarkdown } from '../../src/core/compare/export'
import type { ActiveComparePresetSummary } from '../../src/features/compare/CompareComposerOptions'
import { ComparePresetService } from '../../src/services/ComparePresetService'
import { CompareExecutionService } from '../../src/services/CompareExecutionService'
import { BranchContinuationService } from '../../src/services/BranchContinuationService'
import { RagSingleTurnExecutionService } from '../../src/services/RagSingleTurnExecutionService'
import { SingleTurnExecutionService } from '../../src/services/SingleTurnExecutionService'
import { ThreadService } from '../../src/services/ThreadService'
import { ChatScreen } from '../../src/features/chat/ChatScreen'

const singleTurnExecutionService = new SingleTurnExecutionService()
const compareExecutionService = new CompareExecutionService()
const branchContinuationService = new BranchContinuationService()
const ragSingleTurnExecutionService = new RagSingleTurnExecutionService()
const comparePresetService = new ComparePresetService()
const threadService = new ThreadService()

export default function ThreadChatRoute() {
  const params = useLocalSearchParams<{ threadId?: string | string[] }>()
  const threadId = Array.isArray(params.threadId) ? params.threadId[0] : params.threadId
  const [activeComparePreset, setActiveComparePreset] = useState<ActiveComparePresetSummary | null>(null)

  useEffect(() => {
    void comparePresetService.getActivePreset().then((preset) => {
      setActiveComparePreset(
        preset
          ? {
              name: preset.name,
              branchCount: preset.targetModels.length,
              sharedContextEnabled: preset.sharedContextEnabled
            }
          : null
      )
    })
  }, [])

  return (
    <ChatScreen
      threadId={threadId ?? 'thread-1'}
      activeComparePreset={activeComparePreset}
      runSingleTurn={async ({ threadId: activeThreadId, prompt }) => {
        await singleTurnExecutionService.run({
          threadId: activeThreadId,
          prompt
        })
      }}
      runSingleTurnWithRag={async ({ threadId: activeThreadId, prompt }) =>
        ragSingleTurnExecutionService.run({
          threadId: activeThreadId,
          prompt
        })
      }
      runCompareTurn={async ({ threadId: activeThreadId, prompt }) => {
        await compareExecutionService.run({
          threadId: activeThreadId,
          prompt
        })
      }}
      loadTimeline={(activeThreadId) => threadService.listTimeline(activeThreadId)}
      onContinueCompareBranch={async ({ compareRunId, branchId }) => {
        const continued = await branchContinuationService.continueBranch({
          threadId: threadId ?? 'thread-1',
          compareRunId,
          branchId
        })

        router.push(`/threads/${continued.id}`)
      }}
      onCopyCompareBranch={async ({ text }) => {
        await Clipboard.setStringAsync(text)
        Alert.alert('Copied', 'Branch response copied to clipboard.')
      }}
      onExportCompareRun={async (run) => {
        const markdown = exportCompareRunMarkdown({
          prompt: run.promptText ?? 'Prompt unavailable',
          judgeSummary: run.judgeSummary,
          branches: run.branches.map((branch) => ({
            modelLabel: branch.modelId,
            status: branch.status,
            text: branch.text
          }))
        })

        await Share.share({
          title: 'Compare Run',
          message: markdown
        })
      }}
    />
  )
}
