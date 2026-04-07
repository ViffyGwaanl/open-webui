import { describe, expect, it } from '@jest/globals'

import { exportCompareRunMarkdown } from '../export'

describe('exportCompareRunMarkdown', () => {
  it('serializes prompt, judge summary, and completed branches to markdown', () => {
    const markdown = exportCompareRunMarkdown({
      prompt: 'Compare these answers',
      judgeSummary: 'Candidate 1 wins.',
      branches: [
        {
          modelLabel: 'GPT-4.1',
          status: 'completed',
          text: 'Answer A'
        },
        {
          modelLabel: 'Claude 3.7 Sonnet',
          status: 'failed',
          text: ''
        }
      ]
    })

    expect(markdown).toContain('Compare these answers')
    expect(markdown).toContain('Candidate 1 wins.')
    expect(markdown).toContain('## GPT-4.1')
    expect(markdown).not.toContain('## Claude 3.7 Sonnet')
  })
})
