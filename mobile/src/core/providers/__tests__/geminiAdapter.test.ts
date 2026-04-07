import { beforeEach, describe, expect, it, jest } from '@jest/globals'

import { GeminiAdapter } from '../adapters/gemini'

const profile = {
  id: 'gemini-main',
  presetType: 'gemini',
  displayName: 'Gemini',
  baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
  apiKeyRef: 'provider:gemini-main'
} as const

describe('GeminiAdapter', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  it('normalizes generateContent responses into canonical stream events', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [{ text: 'Gemini answer' }]
              }
            }
          ],
          usageMetadata: {
            promptTokenCount: 9,
            candidatesTokenCount: 4
          }
        }),
        { status: 200 }
      )
    )

    const events: Array<Record<string, unknown>> = []

    await (new GeminiAdapter() as any).streamText(
      profile,
      'gem-key',
      { modelId: 'gemini-2.5-pro', prompt: 'Say hello' },
      (event: Record<string, unknown>) => {
        events.push(event)
      }
    )

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=gem-key'
    )
    expect(events).toEqual([
      { type: 'response_started' },
      { type: 'text_delta', text: 'Gemini answer' },
      { type: 'response_completed', usage: { inputTokens: 9, outputTokens: 4 } }
    ])
  })

  it('maps batch embedding responses into number arrays', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          embeddings: [{ values: [0.5, 0.6] }, { values: [0.7, 0.8] }]
        }),
        { status: 200 }
      )
    )

    await expect(
      (new GeminiAdapter() as any).embedTexts(profile, 'gem-key', {
        modelId: 'text-embedding-004',
        texts: ['one', 'two']
      })
    ).resolves.toEqual([
      [0.5, 0.6],
      [0.7, 0.8]
    ])
  })
})
