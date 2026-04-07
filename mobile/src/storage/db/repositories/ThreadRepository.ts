import { and, asc, desc, eq, type InferInsertModel, type InferSelectModel } from 'drizzle-orm'

import { db } from '../client'
import { turns } from '../schema'

export type TurnRecord = InferSelectModel<typeof turns>
export type NewTurnRecord = InferInsertModel<typeof turns>

type TurnUpdatePatch = Partial<
  Pick<TurnRecord, 'contentJson' | 'status' | 'usageJson' | 'updatedAt' | 'providerProfileId' | 'modelId'>
>

export class ThreadRepository {
  constructor(private readonly database = db) {}

  async insertTurn(record: NewTurnRecord) {
    await this.database.insert(turns).values(record)
  }

  async findLatestAssistantTurn(threadId: string): Promise<TurnRecord | null> {
    const [turn] = await this.database
      .select()
      .from(turns)
      .where(and(eq(turns.threadId, threadId), eq(turns.role, 'assistant')))
      .orderBy(desc(turns.createdAt))
      .limit(1)

    return turn ?? null
  }

  async updateTurn(turnId: string, patch: TurnUpdatePatch) {
    await this.database.update(turns).set(patch).where(eq(turns.id, turnId))
  }

  async listTurns(threadId: string): Promise<TurnRecord[]> {
    return this.database
      .select()
      .from(turns)
      .where(eq(turns.threadId, threadId))
      .orderBy(asc(turns.createdAt))
  }
}
