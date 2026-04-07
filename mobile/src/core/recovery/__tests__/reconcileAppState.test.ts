import { describe, expect, it } from '@jest/globals'

import { reconcileAppState } from '../reconcileAppState'

describe('reconcileAppState', () => {
  it('marks interrupted compare branches and indexing jobs into recoverable states', () => {
    const result = reconcileAppState({
      compareRuns: [
        {
          run: { id: 'compare-1', status: 'running' },
          branches: [
            { id: 'branch-1', status: 'completed' },
            { id: 'branch-2', status: 'streaming' }
          ],
          judge: { id: 'judge-1', status: 'running' }
        }
      ],
      indexJobs: [
        {
          job: { id: 'job-1', status: 'running' },
          document: { id: 'doc-1', indexStatus: 'indexing' }
        }
      ]
    })

    expect(result.compare[0]).toEqual(
      expect.objectContaining({
        runId: 'compare-1',
        runStatus: 'partial',
        branchPatches: [
          {
            branchId: 'branch-2',
            status: 'interrupted'
          }
        ],
        judgePatch: {
          judgeRunId: 'judge-1',
          status: 'failed'
        }
      })
    )
    expect(result.indexing[0]).toEqual({
      jobId: 'job-1',
      jobStatus: 'interrupted',
      documentId: 'doc-1',
      documentIndexStatus: 'pending'
    })
  })
})
