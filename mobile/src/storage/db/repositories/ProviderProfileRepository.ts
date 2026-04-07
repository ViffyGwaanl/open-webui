import { asc, eq, type InferInsertModel, type InferSelectModel } from 'drizzle-orm'

import { db } from '../client'
import { providerProfiles } from '../schema'

export type ProviderProfileRecord = InferSelectModel<typeof providerProfiles>
export type NewProviderProfileRecord = InferInsertModel<typeof providerProfiles>

export class ProviderProfileRepository {
  constructor(private readonly database = db) {}

  async upsert(record: NewProviderProfileRecord) {
    await this.database
      .insert(providerProfiles)
      .values(record)
      .onConflictDoUpdate({
        target: providerProfiles.id,
        set: {
          presetType: record.presetType,
          displayName: record.displayName,
          baseUrl: record.baseUrl,
          apiKeyRef: record.apiKeyRef,
          extraHeadersJson: record.extraHeadersJson,
          enabled: record.enabled,
          updatedAt: record.updatedAt
        }
      })
  }

  async findById(id: string): Promise<ProviderProfileRecord | null> {
    const [profile] = await this.database
      .select()
      .from(providerProfiles)
      .where(eq(providerProfiles.id, id))
      .limit(1)

    return profile ?? null
  }

  async listAll(): Promise<ProviderProfileRecord[]> {
    return this.database.select().from(providerProfiles).orderBy(asc(providerProfiles.updatedAt))
  }
}
