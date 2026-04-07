import type { InferInsertModel } from 'drizzle-orm'
import { eq } from 'drizzle-orm'

import { db } from '../client'
import { turnRetrievalContexts, turnRetrievalItems } from '../schema'

type NewContextRecord = InferInsertModel<typeof turnRetrievalContexts>
type NewItemRecord = InferInsertModel<typeof turnRetrievalItems>

export class TurnEvidenceRepository {
  constructor(private readonly database = db) {}

  async insertContext(record: NewContextRecord) {
    await this.database.insert(turnRetrievalContexts).values(record)
  }

  async insertItems(_retrievalContextId: string, items: NewItemRecord[]) {
    if (items.length === 0) {
      return
    }

    await this.database.insert(turnRetrievalItems).values(items)
  }

  async listItemsForTurn(turnId: string) {
    const [context] = await this.database
      .select()
      .from(turnRetrievalContexts)
      .where(eq(turnRetrievalContexts.turnId, turnId))
      .limit(1)

    if (!context) {
      return []
    }

    return this.database
      .select()
      .from(turnRetrievalItems)
      .where(eq(turnRetrievalItems.retrievalContextId, context.id))
  }
}
