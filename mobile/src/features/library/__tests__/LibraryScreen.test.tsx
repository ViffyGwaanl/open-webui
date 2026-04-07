import { fireEvent, render, screen } from '@testing-library/react-native'
import { describe, expect, it, jest } from '@jest/globals'

import { LibraryScreen } from '../LibraryScreen'

describe('LibraryScreen', () => {
  it('renders imported documents and triggers the import action', () => {
    const onImportPress: () => void = jest.fn()

    render(
      <LibraryScreen
        documents={[
          {
            id: 'doc-1',
            displayName: 'guide.md',
            fileType: 'md',
            indexStatus: 'completed',
            textLength: 1200,
            pageCount: null
          }
        ]}
        onImportPress={onImportPress}
      />
    )

    expect(screen.getByText('guide.md')).toBeTruthy()
    expect(screen.getByText('completed')).toBeTruthy()

    fireEvent.press(screen.getByText('Import Document'))

    expect(onImportPress).toHaveBeenCalled()
  })
})
