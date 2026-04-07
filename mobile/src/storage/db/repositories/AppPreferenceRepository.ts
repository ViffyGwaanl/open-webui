import { eq } from 'drizzle-orm'

import { db } from '../client'
import { appPreferences } from '../schema'

export class AppPreferenceRepository {
  constructor(private readonly database = db) {}

  async getValue(key: string): Promise<string | null> {
    const [record] = await this.database
      .select()
      .from(appPreferences)
      .where(eq(appPreferences.key, key))
      .limit(1)

    return record?.valueJson ?? null
  }

  async setValue(key: string, valueJson: string) {
    await this.database
      .insert(appPreferences)
      .values({
        key,
        valueJson,
        updatedAt: Date.now()
      })
      .onConflictDoUpdate({
        target: appPreferences.key,
        set: {
          valueJson,
          updatedAt: Date.now()
        }
      })
  }
}
