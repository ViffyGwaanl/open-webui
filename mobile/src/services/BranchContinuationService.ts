type ContinuationSourceTurn = {
  id: string
  threadId: string
  role: 'user' | 'assistant'
  providerProfileId: string | null
  modelId: string | null
  status: string
  contentJson: string
  usageJson: string
  createdAt: number
  updatedAt: number
}

type ContinuationSource = {
  promptTurn: {
    id: string
    contentJson: string
    createdAt: number
  }
  parentTurns: ContinuationSourceTurn[]
  branch: {
    id: string
    providerProfileId: string
    modelId: string
    contentJson: string
    continuationThreadId: string | null
  }
}

type Repositories = {
  loadContinuationSource: (input: {
    threadId: string
    compareRunId: string
    branchId: string
  }) => Promise<ContinuationSource>
  createThread: (record: {
    id: string
    title: string
    sourceThreadId: string
    sourceBranchId: string
    createdAt: number
    updatedAt: number
  }) => Promise<{ id: string }>
  insertTurns: (threadId: string, turns: ContinuationSourceTurn[]) => Promise<void>
  linkContinuationThread: (branchId: string, threadId: string) => Promise<void>
}

type BranchContinuationServiceDeps = {
  repositories?: Repositories
  createId?: () => string
  now?: () => number
}

function parseTextContent(contentJson: string) {
  try {
    const blocks = JSON.parse(contentJson) as Array<{ type?: string; text?: string }>
    return blocks
      .filter((block) => block.type === 'text' && typeof block.text === 'string')
      .map((block) => block.text)
      .join('')
  } catch {
    return ''
  }
}

function createRandomId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function createDefaultRepositories(): Repositories {
  const { CompareRepository } = require('../storage/db/repositories/CompareRepository') as typeof import('../storage/db/repositories/CompareRepository')
  const { ThreadRepository } = require('../storage/db/repositories/ThreadRepository') as typeof import('../storage/db/repositories/ThreadRepository')

  const compareRepository = new CompareRepository()
  const threadRepository = new ThreadRepository()

  return {
    loadContinuationSource: async ({ threadId, compareRunId, branchId }) => {
      const run = await compareRepository.findRunById(compareRunId)
      const branch = await compareRepository.findBranchById(branchId)
      const turns = await threadRepository.listTurns(threadId)

      if (!run || run.threadId !== threadId) {
        throw new Error(`Compare run ${compareRunId} does not belong to thread ${threadId}`)
      }

      if (!branch || branch.compareRunId !== compareRunId) {
        throw new Error(`Compare branch ${branchId} does not belong to compare run ${compareRunId}`)
      }

      const promptTurnIndex = turns.findIndex((turn) => turn.id === run.promptTurnId)

      if (promptTurnIndex < 0) {
        throw new Error(`Prompt turn ${run.promptTurnId} is missing from thread ${threadId}`)
      }

      const promptTurn = turns[promptTurnIndex]

      return {
        promptTurn: {
          id: promptTurn.id,
          contentJson: promptTurn.contentJson,
          createdAt: promptTurn.createdAt
        },
        parentTurns: turns.slice(0, promptTurnIndex + 1).map((turn) => ({
          ...turn,
          role: turn.role as 'user' | 'assistant'
        })),
        branch: {
          id: branch.id,
          providerProfileId: branch.providerProfileId,
          modelId: branch.modelId,
          contentJson: branch.contentJson,
          continuationThreadId: branch.continuationThreadId ?? null
        }
      }
    },
    createThread: async (record) => threadRepository.createThread(record),
    insertTurns: async (_threadId, turns) => {
      await threadRepository.insertTurns(turns as never)
    },
    linkContinuationThread: async (branchId, threadId) => {
      await compareRepository.updateBranch(branchId, {
        continuationThreadId: threadId,
        updatedAt: Date.now()
      })
    }
  }
}

export class BranchContinuationService {
  private readonly repositories: Repositories
  private readonly createId: () => string
  private readonly now: () => number

  constructor({ repositories = createDefaultRepositories(), createId = createRandomId, now = () => Date.now() }: BranchContinuationServiceDeps = {}) {
    this.repositories = repositories
    this.createId = createId
    this.now = now
  }

  async continueBranch(input: {
    threadId: string
    compareRunId: string
    branchId: string
  }) {
    const source = await this.repositories.loadContinuationSource(input)

    if (source.branch.continuationThreadId) {
      return {
        id: source.branch.continuationThreadId,
        sourceThreadId: input.threadId,
        sourceBranchId: input.branchId
      }
    }

    const createdAt = this.now()
    const title = parseTextContent(source.promptTurn.contentJson) || 'Continued branch'
    const childThreadId = this.createId()

    const childThread = await this.repositories.createThread({
      id: childThreadId,
      title,
      sourceThreadId: input.threadId,
      sourceBranchId: input.branchId,
      createdAt,
      updatedAt: createdAt
    })

    const copiedTurns = source.parentTurns.map((turn) => ({
      ...turn,
      id: this.createId(),
      threadId: childThread.id
    }))
    const assistantTurnCreatedAt = this.now()
    const branchAssistantTurn: ContinuationSourceTurn = {
      id: this.createId(),
      threadId: childThread.id,
      role: 'assistant',
      providerProfileId: source.branch.providerProfileId,
      modelId: source.branch.modelId,
      status: 'completed',
      contentJson: source.branch.contentJson,
      usageJson: '{}',
      createdAt: assistantTurnCreatedAt,
      updatedAt: assistantTurnCreatedAt
    }

    await this.repositories.insertTurns(childThread.id, [...copiedTurns, branchAssistantTurn])
    await this.repositories.linkContinuationThread(input.branchId, childThread.id)

    return {
      id: childThread.id,
      sourceThreadId: input.threadId,
      sourceBranchId: input.branchId
    }
  }
}
