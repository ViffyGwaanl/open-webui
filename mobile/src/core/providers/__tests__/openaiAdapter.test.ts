import { describe, expect, it, jest, beforeEach } from '@jest/globals'

import { OpenAIAdapter } from '../adapters/openai'

const profile = {
  id: 'openai-main',
  presetType: 'openai',
  displayName: 'OpenAI',
  baseUrl: 'https://api.openai.com/v1',
  apiKeyRef: 'provider:openai-main'
} as const

describe('OpenAIAdapter', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  it('normalizes chat completions into canonical stream events', async () => {
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: 'OpenAI answer'
                }
              }
            ],
            usage: {
              prompt_tokens: 12,
              completion_tokens: 5
            }
          }),
          { status: 200 }
        )
      )

    const events: Array<Record<string, unknown>> = []

    await (new OpenAIAdapter() as any).streamText(
      profile,
      'sk-test',
      { modelId: 'gpt-4.1-mini', prompt: 'Say hello' },
      (event: Record<string, unknown>) => {
        events.push(event)
      }
    )

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer sk-test'
        })
      })
    )
    expect(events).toEqual([
      { type: 'response_started' },
      { type: 'text_delta', text: 'OpenAI answer' },
      { type: 'response_completed', usage: { inputTokens: 12, outputTokens: 5 } }
    ])
  })

  it('maps embeddings responses into number arrays', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          data: [
            { embedding: [0.1, 0.2] },
            { embedding: [0.3, 0.4] }
          ]
        }),
        { status: 200 }
      )
    )

    await expect(
      (new OpenAIAdapter() as any).embedTexts(profile, 'sk-test', {
        modelId: 'text-embedding-3-small',
        texts: ['one', 'two']
      })
    ).resolves.toEqual([
      [0.1, 0.2],
      [0.3, 0.4]
    ])
  })
})
