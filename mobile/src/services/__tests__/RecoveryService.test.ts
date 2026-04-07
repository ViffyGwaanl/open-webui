import { describe, expect, it, jest } from '@jest/globals'

import { RecoveryService } from '../RecoveryService'

describe('RecoveryService', () => {
  it('reconciles interrupted compare runs and indexing jobs on launch', async () => {
    const compareRepository = {
      findIncompleteRuns: jest.fn(async () => [
        {
          run: { id: 'compare-1', status: 'running' },
          branches: [
            { id: 'branch-1', status: 'completed' },
            { id: 'branch-2', status: 'streaming' }
          ],
          judge: { id: 'judge-1', status: 'running' }
        }
      ]),
      updateRun: jest.fn(async () => {}),
      updateBranch: jest.fn(async () => {}),
      updateJudgeRun: jest.fn(async () => {})
    }
    const indexRepository = {
      findInterruptedJobs: jest.fn(async () => [
        {
          job: { id: 'job-1', status: 'running' },
          document: { id: 'doc-1', indexStatus: 'indexing' }
        }
      ]),
      updateIndexJob: jest.fn(async () => {}),
      updateDocument: jest.fn(async () => {})
    }
    const service = new RecoveryService({
      compareRepository: compareRepository as never,
      indexRepository: indexRepository as never
    })

    const result = await service.reconcileOnLaunch()

    expect(compareRepository.updateRun).toHaveBeenCalledWith('compare-1', {
      status: 'partial',
      updatedAt: expect.any(Number)
    })
    expect(compareRepository.updateBranch).toHaveBeenCalledWith('branch-2', {
      status: 'interrupted',
      updatedAt: expect.any(Number)
    })
    expect(compareRepository.updateJudgeRun).toHaveBeenCalledWith('judge-1', {
      status: 'failed',
      errorJson: JSON.stringify({ code: 'recovered_after_restart', message: 'Interrupted before completion' }),
      updatedAt: expect.any(Number)
    })
    expect(indexRepository.updateIndexJob).toHaveBeenCalledWith('job-1', {
      status: 'interrupted',
      lastErrorJson: JSON.stringify({ code: 'recovered_after_restart', message: 'Interrupted before completion' }),
      updatedAt: expect.any(Number)
    })
    expect(indexRepository.updateDocument).toHaveBeenCalledWith('doc-1', {
      indexStatus: 'pending',
      updatedAt: expect.any(Number)
    })
    expect(result).toEqual({
      compareRunsReconciled: 1,
      indexJobsReconciled: 1
    })
  })
})
