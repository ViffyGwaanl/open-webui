import {
  asc,
  desc,
  eq,
  inArray,
  type InferInsertModel,
  type InferSelectModel
} from 'drizzle-orm'

import { db } from '../client'
import { compareBranches, compareRuns, judgeRuns } from '../schema'

type CompareRunRecord = InferSelectModel<typeof compareRuns>
type CompareBranchRecord = InferSelectModel<typeof compareBranches>
type JudgeRunRecord = InferSelectModel<typeof judgeRuns>
export type NewCompareRunRecord = InferInsertModel<typeof compareRuns>
export type NewCompareBranchRecord = InferInsertModel<typeof compareBranches>
export type NewJudgeRunRecord = InferInsertModel<typeof judgeRuns>

export type TimelineCompareBranch = {
  id: string
  providerProfileId: string
  modelId: string
  status: string
  text: string
  usageJson: string
  latencyMs: number | null
  errorJson: string
  continuationThreadId: string | null
}

export type TimelineCompareRunCard = {
  id: string
  promptTurnId: string
  status: string
  judgeSummary: string | null
  branches: TimelineCompareBranch[]
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

function mapBranch(branch: CompareBranchRecord): TimelineCompareBranch {
  return {
    id: branch.id,
    providerProfileId: branch.providerProfileId,
    modelId: branch.modelId,
    status: branch.status,
    text: parseTextContent(branch.contentJson),
    usageJson: branch.usageJson,
    latencyMs: branch.latencyMs,
    errorJson: branch.errorJson,
    continuationThreadId: branch.continuationThreadId ?? null
  }
}

export class CompareRepository {
  constructor(private readonly database = db) {}

  async findIncompleteRuns() {
    const runs = await this.database
      .select()
      .from(compareRuns)
      .where(inArray(compareRuns.status, ['queued', 'running']))

    if (runs.length === 0) {
      return []
    }

    const runIds = runs.map((run) => run.id)
    const branches = await this.database
      .select()
      .from(compareBranches)
      .where(inArray(compareBranches.compareRunId, runIds))
    const judges = await this.database
      .select()
      .from(judgeRuns)
      .where(inArray(judgeRuns.compareRunId, runIds))

    return runs.map((run) => ({
      run: { id: run.id, status: run.status },
      branches: branches
        .filter((branch) => branch.compareRunId === run.id)
        .map((branch) => ({ id: branch.id, status: branch.status })),
      judge:
        judges
          .filter((judge) => judge.compareRunId === run.id)
          .sort((left, right) => right.createdAt - left.createdAt)[0] ?? null
    }))
  }

  async findRunById(compareRunId: string): Promise<CompareRunRecord | null> {
    const [run] = await this.database
      .select()
      .from(compareRuns)
      .where(eq(compareRuns.id, compareRunId))
      .limit(1)

    return run ?? null
  }

  async findBranchById(branchId: string): Promise<CompareBranchRecord | null> {
    const [branch] = await this.database
      .select()
      .from(compareBranches)
      .where(eq(compareBranches.id, branchId))
      .limit(1)

    return branch ?? null
  }

  async insertRun(record: NewCompareRunRecord) {
    await this.database.insert(compareRuns).values(record)
  }

  async insertBranches(records: NewCompareBranchRecord[]) {
    if (records.length === 0) {
      return
    }

    await this.database.insert(compareBranches).values(records)
  }

  async updateRun(
    compareRunId: string,
    patch: Partial<
      Pick<
        CompareRunRecord,
        | 'status'
        | 'compareConfigJson'
        | 'judgeConfigJson'
        | 'retrievalContextJson'
        | 'aggregateUsageJson'
        | 'aggregateTimingJson'
        | 'updatedAt'
      >
    >
  ) {
    await this.database.update(compareRuns).set(patch).where(eq(compareRuns.id, compareRunId))
  }

  async updateBranch(
    branchId: string,
    patch: Partial<
      Pick<
        CompareBranchRecord,
        | 'status'
        | 'contentJson'
        | 'usageJson'
        | 'latencyMs'
        | 'errorJson'
        | 'continuationThreadId'
        | 'attemptCount'
        | 'updatedAt'
      >
    >
  ) {
    await this.database.update(compareBranches).set(patch).where(eq(compareBranches.id, branchId))
  }

  async insertJudgeRun(record: NewJudgeRunRecord) {
    await this.database.insert(judgeRuns).values(record)
  }

  async updateJudgeRun(
    judgeRunId: string,
    patch: Partial<
      Pick<JudgeRunRecord, 'status' | 'contentJson' | 'usageJson' | 'latencyMs' | 'errorJson' | 'updatedAt'>
    >
  ) {
    await this.database.update(judgeRuns).set(patch).where(eq(judgeRuns.id, judgeRunId))
  }

  async listTimelineCards(threadId: string): Promise<TimelineCompareRunCard[]> {
    const runs = await this.database
      .select()
      .from(compareRuns)
      .where(eq(compareRuns.threadId, threadId))
      .orderBy(asc(compareRuns.createdAt))

    if (runs.length === 0) {
      return []
    }

    const runIds = runs.map((run) => run.id)
    const branches = await this.loadBranches(runIds)
    const judges = await this.loadJudges(runIds)

    return runs.map((run) => ({
      id: run.id,
      promptTurnId: run.promptTurnId,
      status: run.status,
      judgeSummary: judges.get(run.id) ?? null,
      branches: branches.get(run.id) ?? []
    }))
  }

  private async loadBranches(runIds: string[]) {
    const rows = await this.database
      .select()
      .from(compareBranches)
      .where(inArray(compareBranches.compareRunId, runIds))
      .orderBy(asc(compareBranches.branchIndex))

    return rows.reduce<Map<string, TimelineCompareBranch[]>>((groups, branch) => {
      const current = groups.get(branch.compareRunId) ?? []
      current.push(mapBranch(branch))
      groups.set(branch.compareRunId, current)
      return groups
    }, new Map())
  }

  private async loadJudges(runIds: string[]) {
    const rows = await this.database
      .select()
      .from(judgeRuns)
      .where(inArray(judgeRuns.compareRunId, runIds))
      .orderBy(desc(judgeRuns.createdAt))

    return rows.reduce<Map<string, string>>((map, judge) => {
      if (!map.has(judge.compareRunId)) {
        map.set(judge.compareRunId, parseTextContent(judge.contentJson))
      }
      return map
    }, new Map())
  }
}
