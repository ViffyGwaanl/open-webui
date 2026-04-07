import { describe, expect, it, jest } from '@jest/globals'

import { buildJudgePrompt } from '../buildJudgePrompt'
import { runJudgeRun } from '../runJudgeRun'

describe('buildJudgePrompt', () => {
  it('includes each completed branch answer with provider and model labels', () => {
    const prompt = buildJudgePrompt({
      prompt: 'Summarize the architecture',
      branches: [
        {
          providerLabel: 'OpenAI',
          modelLabel: 'GPT-4.1',
          text: 'Answer A'
        },
        {
          providerLabel: 'Claude',
          modelLabel: 'Claude 3.7 Sonnet',
          text: 'Answer B'
        }
      ]
    })

    expect(prompt).toContain('OpenAI / GPT-4.1')
    expect(prompt).toContain('Claude / Claude 3.7 Sonnet')
  })
})

describe('runJudgeRun', () => {
  it('skips judge execution when no branches completed successfully', async () => {
    const streamText = jest.fn<() => Promise<string>>()

    const result = await runJudgeRun({
      prompt: 'Which answer is best?',
      branches: [
        {
          providerLabel: 'OpenAI',
          modelLabel: 'GPT-4.1',
          status: 'failed',
          text: ''
        }
      ],
      streamText
    })

    expect(result).toBeNull()
    expect(streamText).not.toHaveBeenCalled()
  })

  it('judges the successful subset when partial compare results are available', async () => {
    const streamText = jest.fn<() => Promise<string>>(async () => 'Candidate 2 is the most complete.')

    const result = await runJudgeRun({
      prompt: 'Which answer is best?',
      branches: [
        {
          providerLabel: 'OpenAI',
          modelLabel: 'GPT-4.1',
          status: 'completed',
          text: 'Answer A'
        },
        {
          providerLabel: 'Claude',
          modelLabel: 'Claude 3.7 Sonnet',
          status: 'failed',
          text: ''
        },
        {
          providerLabel: 'Gemini',
          modelLabel: 'Gemini 2.5 Pro',
          status: 'completed',
          text: 'Answer B'
        }
      ],
      streamText
    })

    expect(streamText).toHaveBeenCalledTimes(1)
    expect(result).toEqual('Candidate 2 is the most complete.')
  })
})
