import { describe, expect, it } from '@jest/globals'

import { ReviewDemoAdapter } from '../adapters/reviewDemo'

const profile = {
  id: 'review-demo-main',
  presetType: 'review-demo',
  displayName: 'Review Demo',
  baseUrl: 'local://review-demo',
  apiKeyRef: 'provider:review-demo-main'
} as const

describe('ReviewDemoAdapter', () => {
  it('exposes chat and embedding models without requiring network access', async () => {
    await expect(new ReviewDemoAdapter().listModels(profile, '')).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ modelId: 'review-demo-balanced', isEmbeddingModel: false }),
        expect.objectContaining({ modelId: 'review-demo-embedding', isEmbeddingModel: true })
      ])
    )
  })

  it('streams deterministic review-demo answers and embeddings', async () => {
    const adapter = new ReviewDemoAdapter()
    const events: Array<Record<string, unknown>> = []

    await adapter.streamText(
      profile,
      '',
      {
        modelId: 'review-demo-balanced',
        prompt: 'Summarize the architecture'
      },
      (event) => {
        events.push(event)
      }
    )

    expect(events[0]).toEqual({ type: 'response_started' })
    expect(events.some((event) => event.type === 'text_delta')).toBe(true)
    expect(events.at(-1)).toEqual(
      expect.objectContaining({
        type: 'response_completed'
      })
    )

    await expect(
      adapter.embedTexts(profile, '', {
        modelId: 'review-demo-embedding',
        texts: ['one', 'two']
      })
    ).resolves.toEqual([
      expect.any(Array),
      expect.any(Array)
    ])
  })
})
