import {
  compareBranches,
  comparePresets,
  compareRuns,
  judgeRuns
} from '../index'

describe('compare schema', () => {
  it('exports the compare persistence tables', () => {
    expect(comparePresets.id).toBeDefined()
    expect(compareRuns.promptTurnId).toBeDefined()
    expect(compareBranches.compareRunId).toBeDefined()
    expect(compareBranches.continuationThreadId).toBeDefined()
    expect(judgeRuns.compareRunId).toBeDefined()
  })
})
