import { asc, eq, type InferInsertModel, type InferSelectModel } from 'drizzle-orm'

import { db } from '../client'
import { comparePresets } from '../schema'

export type ComparePresetRecord = InferSelectModel<typeof comparePresets>
export type NewComparePresetRecord = InferInsertModel<typeof comparePresets>

export class ComparePresetRepository {
  constructor(private readonly database = db) {}

  async upsert(record: NewComparePresetRecord) {
    await this.database
      .insert(comparePresets)
      .values(record)
      .onConflictDoUpdate({
        target: comparePresets.id,
        set: {
          name: record.name,
          targetModelsJson: record.targetModelsJson,
          judgeConfigJson: record.judgeConfigJson,
          sharedContextEnabled: record.sharedContextEnabled,
          advancedParamsJson: record.advancedParamsJson,
          updatedAt: record.updatedAt
        }
      })
  }

  async listAll(): Promise<ComparePresetRecord[]> {
    return this.database.select().from(comparePresets).orderBy(asc(comparePresets.updatedAt))
  }

  async findById(id: string): Promise<ComparePresetRecord | null> {
    const [preset] = await this.database
      .select()
      .from(comparePresets)
      .where(eq(comparePresets.id, id))
      .limit(1)

    return preset ?? null
  }
}
