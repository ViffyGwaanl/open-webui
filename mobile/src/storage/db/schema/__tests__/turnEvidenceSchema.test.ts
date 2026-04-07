import { turnRetrievalContexts, turnRetrievalItems } from '../index'

describe('turn evidence schema', () => {
  it('exports stable turn-scoped retrieval snapshot tables', () => {
    expect(turnRetrievalContexts.turnId).toBeDefined()
    expect(turnRetrievalItems.retrievalContextId).toBeDefined()
  })
})
