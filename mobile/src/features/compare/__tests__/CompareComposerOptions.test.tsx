import { render, screen } from '@testing-library/react-native'
import { describe, expect, it } from '@jest/globals'

import { CompareComposerOptions } from '../CompareComposerOptions'

describe('CompareComposerOptions', () => {
  it('renders the active preset summary when one is available', () => {
    render(
      <CompareComposerOptions
        activePreset={{
          name: 'Review Demo Trio',
          branchCount: 3,
          sharedContextEnabled: true
        }}
      />
    )

    expect(screen.getByText('Review Demo Trio')).toBeTruthy()
    expect(screen.getByText('3 branches')).toBeTruthy()
    expect(screen.getByText('Shared RAG context on')).toBeTruthy()
  })
})
