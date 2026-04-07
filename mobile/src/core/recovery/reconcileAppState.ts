import { recoverCompareRun } from './compareRecovery'
import { recoverIndexJob } from './indexingRecovery'

export function reconcileAppState(input: {
  compareRuns: Array<{
    run: { id: string; status: string }
    branches: Array<{ id: string; status: string }>
    judge: { id: string; status: string } | null
  }>
  indexJobs: Array<{
    job: { id: string; status: string }
    document: { id: string; indexStatus: string }
  }>
}) {
  return {
    compare: input.compareRuns.map((run) => recoverCompareRun(run)),
    indexing: input.indexJobs.map((job) => recoverIndexJob(job))
  }
}
