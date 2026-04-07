import {
  asc,
  desc,
  eq,
  inArray,
  type InferSelectModel
} from 'drizzle-orm'

import { db } from '../client'
import { compareBranches, compareRuns, judgeRuns } from '../schema'

type CompareRunRecord = InferSelectModel<typeof compareRuns>
type CompareBranchRecord = InferSelectModel<typeof compareBranches>
type JudgeRunRecord = InferSelectModel<typeof judgeRuns>

export type TimelineCompareBranch = {
  id: string
  providerProfileId: string
  modelId: string
  status: string
  text: string
  usageJson: string
  latencyMs: number | null
  errorJson: string
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
    errorJson: branch.errorJson
  }
}

export class CompareRepository {
  constructor(private readonly database = db) {}

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
