import type { CanonicalStreamEvent, CanonicalUsage } from '../core/chat/types'
import { aggregateRunMetrics } from '../core/compare/aggregateRunMetrics'
import { normalizeCompareError } from '../core/compare/compareErrors'
import { runJudgeRun } from '../core/compare/runJudgeRun'
import type { RetrievalContext } from '../core/rag/types'
import { reduceCompareEvent, type CompareRuntimeState } from '../core/compare/stateMachine'
import type {
  NewCompareBranchRecord,
  NewCompareRunRecord,
  NewJudgeRunRecord
} from '../storage/db/repositories/CompareRepository'
import type { CompareRepository } from '../storage/db/repositories/CompareRepository'
import type { ThreadService } from './ThreadService'

type CompareBranchInput = {
  providerProfileId: string
  providerLabel: string
  modelId: string
  modelLabel: string
  streamText: (
    request: { prompt: string },
    sink: (event: CanonicalStreamEvent) => Promise<void> | void
  ) => Promise<void>
}

type JudgeInput = {
  providerProfileId: string
  providerLabel: string
  modelId: string
  modelLabel: string
  streamText: (prompt: string) => Promise<string>
}

type StartCompareRunInput = {
  threadId: string
  prompt: string
  presetId?: string | null
  retrievalContext?: RetrievalContext
  branches: CompareBranchInput[]
  judge?: JudgeInput
}

type CompareRepositoryLike = Pick<
  CompareRepository,
  'insertRun' | 'insertBranches' | 'updateRun' | 'updateBranch' | 'insertJudgeRun' | 'updateJudgeRun'
>

type ThreadServiceLike = Pick<ThreadService, 'createUserTurn'>

type CompareServiceDeps = {
  compareRepository?: CompareRepositoryLike
  threadService?: ThreadServiceLike
  createId?: () => string
  now?: () => number
}

function serializeTextContent(text: string) {
  return JSON.stringify([{ type: 'text', text }])
}

function createDefaultCompareRepository(): CompareRepositoryLike {
  const { CompareRepository } = require('../storage/db/repositories/CompareRepository') as typeof import('../storage/db/repositories/CompareRepository')
  return new CompareRepository()
}

function createDefaultThreadService(): ThreadServiceLike {
  const { ThreadService } = require('./ThreadService') as typeof import('./ThreadService')
  return new ThreadService()
}

function createRandomId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export class CompareService {
  private readonly compareRepository: CompareRepositoryLike
  private readonly threadService: ThreadServiceLike
  private readonly createId: () => string
  private readonly now: () => number

  constructor({
    compareRepository = createDefaultCompareRepository(),
    threadService = createDefaultThreadService(),
    createId = createRandomId,
    now = () => Date.now()
  }: CompareServiceDeps = {}) {
    this.compareRepository = compareRepository
    this.threadService = threadService
    this.createId = createId
    this.now = now
  }

  async startRun({ threadId, prompt, presetId, retrievalContext, branches, judge }: StartCompareRunInput) {
    const promptTurnId = await this.threadService.createUserTurn(threadId, prompt)
    const compareRunId = this.createId()
    const createdAt = this.now()
    const runRecord: NewCompareRunRecord = {
      id: compareRunId,
      threadId,
      promptTurnId,
      status: 'running',
      presetId: presetId ?? null,
      compareConfigJson: JSON.stringify({
        branchCount: branches.length
      }),
      judgeConfigJson: JSON.stringify(
        judge
          ? {
              providerProfileId: judge.providerProfileId,
              modelId: judge.modelId
            }
          : {}
      ),
      retrievalContextJson: JSON.stringify(retrievalContext?.snippets ?? []),
      aggregateUsageJson: '{}',
      aggregateTimingJson: '{}',
      createdAt,
      updatedAt: createdAt
    }
    const branchRecords: NewCompareBranchRecord[] = branches.map((branch, index) => ({
      id: this.createId(),
      compareRunId,
      branchIndex: index,
      providerProfileId: branch.providerProfileId,
      modelId: branch.modelId,
      status: 'queued',
      contentJson: '[]',
      usageJson: '{}',
      latencyMs: null,
      errorJson: '{}',
      attemptCount: 1,
      createdAt,
      updatedAt: createdAt
    }))

    await this.compareRepository.insertRun(runRecord)
    await this.compareRepository.insertBranches(branchRecords)

    let state: CompareRuntimeState = {
      runStatus: 'running',
      judgeStatus: 'idle',
      branches: Object.fromEntries(
        branchRecords.map((branch) => [
          branch.id,
          {
            status: 'queued',
            usage: null,
            latencyMs: null,
            error: null
          }
        ])
      )
    }

    const completedBranches: Array<{
      providerLabel: string
      modelLabel: string
      status: string
      text: string
    }> = []

    await Promise.all(
      branches.map(async (branch, index) => {
        const branchId = branchRecords[index].id
        const branchStartedAt = this.now()
        let settled = false
        let accumulatedText = ''

        try {
          await branch.streamText({ prompt }, async (event) => {
            if (event.type === 'response_started') {
              state = reduceCompareEvent(state, { type: 'branch_started', branchId })
              await this.compareRepository.updateBranch(branchId, {
                status: 'streaming',
                updatedAt: this.now()
              })
            }

            if (event.type === 'text_delta') {
              accumulatedText += event.text
              await this.compareRepository.updateBranch(branchId, {
                contentJson: serializeTextContent(accumulatedText),
                updatedAt: this.now()
              })
            }

            if (event.type === 'response_completed') {
              settled = true
              const latencyMs = this.now() - branchStartedAt
              state = reduceCompareEvent(state, {
                type: 'branch_completed',
                branchId,
                usage: event.usage,
                latencyMs
              })
              completedBranches.push({
                providerLabel: branch.providerLabel,
                modelLabel: branch.modelLabel,
                status: 'completed',
                text: accumulatedText
              })
              await this.compareRepository.updateBranch(branchId, {
                status: 'completed',
                contentJson: serializeTextContent(accumulatedText),
                usageJson: JSON.stringify(event.usage),
                latencyMs,
                errorJson: '{}',
                updatedAt: this.now()
              })
            }

            if (event.type === 'response_failed') {
              settled = true
              const error = normalizeCompareError({ message: event.message })
              state = reduceCompareEvent(state, {
                type: 'branch_failed',
                branchId,
                error
              })
              await this.compareRepository.updateBranch(branchId, {
                status: 'failed',
                errorJson: JSON.stringify(error),
                updatedAt: this.now()
              })
            }
          })
        } catch (error) {
          if (settled) {
            return
          }

          const normalizedError = normalizeCompareError(error)
          state = reduceCompareEvent(state, {
            type: 'branch_failed',
            branchId,
            error: normalizedError
          })
          await this.compareRepository.updateBranch(branchId, {
            status: 'failed',
            errorJson: JSON.stringify(normalizedError),
            updatedAt: this.now()
          })
        }
      })
    )

    const aggregate = aggregateRunMetrics(Object.values(state.branches))

    await this.compareRepository.updateRun(compareRunId, {
      status: state.runStatus,
      aggregateUsageJson: JSON.stringify(aggregate.usage),
      aggregateTimingJson: JSON.stringify(aggregate.timing),
      updatedAt: this.now()
    })

    if (judge && completedBranches.length > 0) {
      const judgeRunId = this.createId()
      const judgeStartedAt = this.now()
      const judgeRecord: NewJudgeRunRecord = {
        id: judgeRunId,
        compareRunId,
        providerProfileId: judge.providerProfileId,
        modelId: judge.modelId,
        status: 'running',
        contentJson: '[]',
        usageJson: '{}',
        latencyMs: null,
        errorJson: '{}',
        createdAt: judgeStartedAt,
        updatedAt: judgeStartedAt
      }

      await this.compareRepository.insertJudgeRun(judgeRecord)

      try {
        const summary = await runJudgeRun({
          prompt,
          branches: completedBranches,
          streamText: judge.streamText
        })

        if (summary !== null) {
          await this.compareRepository.updateJudgeRun(judgeRunId, {
            status: 'completed',
            contentJson: serializeTextContent(summary),
            latencyMs: this.now() - judgeStartedAt,
            updatedAt: this.now()
          })
        }
      } catch (error) {
        const normalizedError = normalizeCompareError(error)
        await this.compareRepository.updateJudgeRun(judgeRunId, {
          status: 'failed',
          errorJson: JSON.stringify(normalizedError),
          latencyMs: this.now() - judgeStartedAt,
          updatedAt: this.now()
        })
      }
    }

    return {
      compareRunId,
      promptTurnId,
      status: state.runStatus
    }
  }
}
