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
}

type BranchContinuationServiceDeps = {
  repositories: Repositories
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

export class BranchContinuationService {
  private readonly repositories: Repositories
  private readonly createId: () => string
  private readonly now: () => number

  constructor({ repositories, createId = createRandomId, now = () => Date.now() }: BranchContinuationServiceDeps) {
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
      id: `${turn.id}-copy`,
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

    return {
      id: childThread.id,
      sourceThreadId: input.threadId,
      sourceBranchId: input.branchId
    }
  }
}
