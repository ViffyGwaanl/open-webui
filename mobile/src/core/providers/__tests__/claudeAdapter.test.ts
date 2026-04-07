import { beforeEach, describe, expect, it, jest } from '@jest/globals'

import { ClaudeAdapter } from '../adapters/claude'

const profile = {
  id: 'claude-main',
  presetType: 'claude',
  displayName: 'Claude',
  baseUrl: 'https://api.anthropic.com/v1',
  apiKeyRef: 'provider:claude-main'
} as const

describe('ClaudeAdapter', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  it('normalizes messages responses into canonical stream events', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          content: [{ type: 'text', text: 'Claude answer' }],
          usage: {
            input_tokens: 11,
            output_tokens: 6
          }
        }),
        { status: 200 }
      )
    )

    const events: Array<Record<string, unknown>> = []

    await (new ClaudeAdapter() as any).streamText(
      profile,
      'claude-key',
      { modelId: 'claude-3-7-sonnet-latest', prompt: 'Say hello' },
      (event: Record<string, unknown>) => {
        events.push(event)
      }
    )

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.anthropic.com/v1/messages',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'x-api-key': 'claude-key',
          'anthropic-version': '2023-06-01'
        })
      })
    )
    expect(events).toEqual([
      { type: 'response_started' },
      { type: 'text_delta', text: 'Claude answer' },
      { type: 'response_completed', usage: { inputTokens: 11, outputTokens: 6 } }
    ])
  })

  it('rejects embedding requests because no Claude embedding path is configured', async () => {
    await expect(
      (new ClaudeAdapter() as any).embedTexts(profile, 'claude-key', {
        modelId: 'claude-embedding',
        texts: ['one']
      })
    ).rejects.toThrow('does not support embeddings')
  })
})
