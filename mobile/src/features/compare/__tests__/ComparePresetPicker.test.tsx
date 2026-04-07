import { fireEvent, render, screen } from '@testing-library/react-native'
import { describe, expect, it, jest } from '@jest/globals'

import { ComparePresetPicker } from '../ComparePresetPicker'

describe('ComparePresetPicker', () => {
  it('renders presets and marks the active preset', () => {
    const onSelect = jest.fn()

    render(
      <ComparePresetPicker
        presets={[
          {
            id: 'preset-1',
            name: 'Triad',
            targetModels: [
              { providerProfileId: 'openai-main', modelId: 'gpt-4.1' },
              { providerProfileId: 'gemini-main', modelId: 'gemini-2.5-pro' }
            ],
            judgeProviderProfileId: 'openai-main',
            judgeModelId: 'gpt-4.1',
            sharedContextEnabled: true,
            advancedParams: {},
            createdAt: 10,
            updatedAt: 10
          }
        ]}
        activePresetId="preset-1"
        onSelect={onSelect}
      />
    )

    expect(screen.getByText('Triad')).toBeTruthy()
    expect(screen.getByText('Active')).toBeTruthy()

    fireEvent.press(screen.getByText('Triad'))

    expect(onSelect).toHaveBeenCalledWith('preset-1')
  })
})
