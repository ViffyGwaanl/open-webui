import { fireEvent, render, screen } from '@testing-library/react-native'
import { describe, expect, it, jest } from '@jest/globals'

import { ComparePresetForm } from '../ComparePresetForm'

describe('ComparePresetForm', () => {
  it('submits selected target models and judge configuration', () => {
    const onSubmit = jest.fn()

    render(
      <ComparePresetForm
        providerTargets={[
          {
            providerProfileId: 'openai-main',
            providerLabel: 'OpenAI',
            models: [
              { modelId: 'gpt-4.1', label: 'GPT-4.1' },
              { modelId: 'gpt-4.1-mini', label: 'GPT-4.1 mini' }
            ]
          },
          {
            providerProfileId: 'claude-main',
            providerLabel: 'Claude',
            models: [{ modelId: 'claude-3-7-sonnet', label: 'Claude 3.7 Sonnet' }]
          }
        ]}
        onSubmit={onSubmit}
      />
    )

    fireEvent.changeText(screen.getByPlaceholderText('Preset name'), 'OpenAI vs Claude')
    fireEvent.press(screen.getByText('GPT-4.1'))
    fireEvent.press(screen.getByText('Claude 3.7 Sonnet'))
    fireEvent.press(screen.getByText('Judge: GPT-4.1'))
    fireEvent.press(screen.getByText('Save Compare Preset'))

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'OpenAI vs Claude',
      targetModels: [
        { providerProfileId: 'openai-main', modelId: 'gpt-4.1' },
        { providerProfileId: 'claude-main', modelId: 'claude-3-7-sonnet' }
      ],
      judgeProviderProfileId: 'openai-main',
      judgeModelId: 'gpt-4.1',
      sharedContextEnabled: false
    })
  })
})
