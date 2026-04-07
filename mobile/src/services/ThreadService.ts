import type { CanonicalUsage } from '../core/chat/types'
import type { TimelineCompareRunCard } from '../storage/db/repositories/CompareRepository'
import type { NewTurnRecord, TurnRecord } from '../storage/db/repositories/ThreadRepository'

type ThreadRepositoryLike = {
  insertTurn: (record: NewTurnRecord) => Promise<void>
  findLatestAssistantTurn: (threadId: string) => Promise<TurnRecord | null>
  updateTurn: (
    turnId: string,
    patch: Partial<
      Pick<TurnRecord, 'contentJson' | 'status' | 'usageJson' | 'updatedAt' | 'providerProfileId' | 'modelId'>
    >
  ) => Promise<void>
  listTurns: (threadId: string) => Promise<TurnRecord[]>
}

type CompareRepositoryLike = {
  listTimelineCards: (threadId: string) => Promise<TimelineCompareRunCard[]>
}

type TextBlock = {
  type: 'text'
  text: string
}

export type ThreadTimelineTurnItem = {
  id: string
  kind: 'turn'
  role: 'user' | 'assistant'
  status: string
  text: string
  providerProfileId: string | null
  modelId: string | null
}

export type ThreadTimelineCompareRunItem = TimelineCompareRunCard & {
  kind: 'compare_run'
}

export type ThreadTimelineItem = ThreadTimelineTurnItem | ThreadTimelineCompareRunItem

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function serializeTextContent(text: string) {
  return JSON.stringify([{ type: 'text', text }] satisfies TextBlock[])
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

function mapTurnToTimelineItem(turn: TurnRecord): ThreadTimelineTurnItem {
  return {
    id: turn.id,
    kind: 'turn',
    role: turn.role as 'user' | 'assistant',
    status: turn.status,
    text: parseTextContent(turn.contentJson),
    providerProfileId: turn.providerProfileId ?? null,
    modelId: turn.modelId ?? null
  }
}

function createDefaultThreadRepository(): ThreadRepositoryLike {
  const { ThreadRepository } = require('../storage/db/repositories/ThreadRepository') as typeof import('../storage/db/repositories/ThreadRepository')
  return new ThreadRepository()
}

function createDefaultCompareRepository(): CompareRepositoryLike {
  const { CompareRepository } = require('../storage/db/repositories/CompareRepository') as typeof import('../storage/db/repositories/CompareRepository')
  return new CompareRepository()
}

export class ThreadService {
  constructor(
    private readonly threadRepository: ThreadRepositoryLike = createDefaultThreadRepository(),
    private readonly compareRepository: CompareRepositoryLike = createDefaultCompareRepository()
  ) {}

  async createUserTurn(threadId: string, prompt: string) {
    const turnId = createId('turn')
    const now = Date.now()
    await this.threadRepository.insertTurn({
      id: turnId,
      threadId,
      role: 'user',
      providerProfileId: null,
      modelId: null,
      status: 'completed',
      contentJson: serializeTextContent(prompt),
      usageJson: '{}',
      createdAt: now,
      updatedAt: now
    } satisfies NewTurnRecord)

    return turnId
  }

  async appendAssistantDelta(threadId: string, text: string) {
    const now = Date.now()
    const existing = await this.threadRepository.findLatestAssistantTurn(threadId)

    if (!existing || existing.status !== 'streaming') {
      await this.threadRepository.insertTurn({
        id: createId('turn'),
        threadId,
        role: 'assistant',
        providerProfileId: null,
        modelId: null,
        status: 'streaming',
        contentJson: serializeTextContent(text),
        usageJson: '{}',
        createdAt: now,
        updatedAt: now
      } satisfies NewTurnRecord)
      return
    }

    await this.threadRepository.updateTurn(existing.id, {
      contentJson: serializeTextContent(parseTextContent(existing.contentJson) + text),
      updatedAt: now
    })
  }

  async completeAssistantTurn(threadId: string, usage: CanonicalUsage) {
    const existing = await this.threadRepository.findLatestAssistantTurn(threadId)

    if (!existing || existing.status !== 'streaming') {
      throw new Error(`No streaming assistant turn found for thread ${threadId}`)
    }

    await this.threadRepository.updateTurn(existing.id, {
      status: 'completed',
      usageJson: JSON.stringify(usage),
      updatedAt: Date.now()
    })
  }

  async listTimeline(threadId: string): Promise<ThreadTimelineItem[]> {
    const [turns, compareCards] = await Promise.all([
      this.threadRepository.listTurns(threadId),
      this.compareRepository.listTimelineCards(threadId)
    ])
    const compareCardsByPromptTurnId = compareCards.reduce<Map<string, ThreadTimelineCompareRunItem[]>>(
      (map, compareCard) => {
        const current = map.get(compareCard.promptTurnId) ?? []
        current.push({
          ...compareCard,
          kind: 'compare_run'
        })
        map.set(compareCard.promptTurnId, current)
        return map
      },
      new Map()
    )

    return turns.flatMap<ThreadTimelineItem>((turn) => {
      const items: ThreadTimelineItem[] = [mapTurnToTimelineItem(turn)]
      const anchoredCompareCards = compareCardsByPromptTurnId.get(turn.id) ?? []
      items.push(...anchoredCompareCards)
      return items
    })
  }
}
