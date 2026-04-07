import { reconcileAppState } from '../core/recovery/reconcileAppState'
import type { CompareRepository } from '../storage/db/repositories/CompareRepository'
import type { RagIndexRepository } from '../storage/index-db/repositories/RagIndexRepository'

const RECOVERY_ERROR_JSON = JSON.stringify({
  code: 'recovered_after_restart',
  message: 'Interrupted before completion'
})

type CompareRepositoryLike = Pick<
  CompareRepository,
  'findIncompleteRuns' | 'updateRun' | 'updateBranch' | 'updateJudgeRun'
>

type IndexRepositoryLike = Pick<
  RagIndexRepository,
  'findInterruptedJobs' | 'updateIndexJob' | 'updateDocument'
>

type RecoveryServiceDeps = {
  compareRepository?: CompareRepositoryLike
  indexRepository?: IndexRepositoryLike
  now?: () => number
}

function createDefaultCompareRepository(): CompareRepositoryLike {
  const { CompareRepository } = require('../storage/db/repositories/CompareRepository') as typeof import('../storage/db/repositories/CompareRepository')
  return new CompareRepository()
}

function createDefaultIndexRepository(): IndexRepositoryLike {
  const { RagIndexRepository } = require('../storage/index-db/repositories/RagIndexRepository') as typeof import('../storage/index-db/repositories/RagIndexRepository')
  return new RagIndexRepository()
}

export class RecoveryService {
  private readonly compareRepository: CompareRepositoryLike
  private readonly indexRepository: IndexRepositoryLike
  private readonly now: () => number

  constructor({
    compareRepository = createDefaultCompareRepository(),
    indexRepository = createDefaultIndexRepository(),
    now = () => Date.now()
  }: RecoveryServiceDeps = {}) {
    this.compareRepository = compareRepository
    this.indexRepository = indexRepository
    this.now = now
  }

  async reconcileOnLaunch() {
    const [compareRuns, indexJobs] = await Promise.all([
      this.compareRepository.findIncompleteRuns(),
      this.indexRepository.findInterruptedJobs()
    ])
    const patches = reconcileAppState({
      compareRuns,
      indexJobs
    })
    const updatedAt = this.now()

    await Promise.all(
      patches.compare.map(async (patch) => {
        await this.compareRepository.updateRun(patch.runId, {
          status: patch.runStatus,
          updatedAt
        })
        await Promise.all(
          patch.branchPatches.map((branchPatch) =>
            this.compareRepository.updateBranch(branchPatch.branchId, {
              status: branchPatch.status,
              updatedAt
            })
          )
        )

        if (patch.judgePatch) {
          await this.compareRepository.updateJudgeRun(patch.judgePatch.judgeRunId, {
            status: patch.judgePatch.status,
            errorJson: RECOVERY_ERROR_JSON,
            updatedAt
          })
        }
      })
    )

    await Promise.all(
      patches.indexing.map(async (patch) => {
        await this.indexRepository.updateIndexJob(patch.jobId, {
          status: patch.jobStatus,
          lastErrorJson: RECOVERY_ERROR_JSON,
          updatedAt
        })
        await this.indexRepository.updateDocument(patch.documentId, {
          indexStatus: patch.documentIndexStatus,
          updatedAt
        })
      })
    )

    return {
      compareRunsReconciled: patches.compare.length,
      indexJobsReconciled: patches.indexing.length
    }
  }
}
