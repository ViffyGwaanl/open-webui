import { appPreferences, modelCatalog, providerProfiles, threads, turns } from '../index'

describe('native platform schema', () => {
  it('exports the required platform-core tables', () => {
    expect(providerProfiles.id).toBeDefined()
    expect(modelCatalog.modelId).toBeDefined()
    expect(threads.id).toBeDefined()
    expect(turns.threadId).toBeDefined()
    expect(appPreferences.key).toBeDefined()
  })
})
