import { fireEvent, render, screen } from '@testing-library/react-native'
import { describe, expect, it, jest } from '@jest/globals'

import { LibraryScreen } from '../LibraryScreen'

describe('LibraryScreen', () => {
  it('renders imported documents and triggers the import action', () => {
    const onImportPress: () => void = jest.fn()
    const onSelectDocument: (documentId: string) => void = jest.fn()

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
        onSelectDocument={onSelectDocument}
      />
    )

    expect(screen.getByText('guide.md')).toBeTruthy()
    expect(screen.getByText('completed')).toBeTruthy()

    fireEvent.press(screen.getByText('Import Document'))
    fireEvent.press(screen.getByText('guide.md'))

    expect(onImportPress).toHaveBeenCalled()
    expect(onSelectDocument).toHaveBeenCalledWith('doc-1')
  })
})
