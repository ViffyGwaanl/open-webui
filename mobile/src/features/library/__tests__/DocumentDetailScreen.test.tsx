import { render, screen } from '@testing-library/react-native'
import { describe, expect, it } from '@jest/globals'

import { DocumentDetailScreen } from '../DocumentDetailScreen'

describe('DocumentDetailScreen', () => {
  it('renders the indexed document summary and excerpt', () => {
    render(
      <DocumentDetailScreen
        document={{
          id: 'doc-1',
          displayName: 'guide.pdf',
          fileType: 'pdf',
          storageUri: 'file:///managed/guide.pdf',
          pageCount: 12,
          textLength: 2048,
          indexStatus: 'completed',
          outline: [{ depth: 1, title: 'Introduction' }],
          normalizedText: 'This is the beginning of the guide.',
          chunkCount: 24
        }}
      />
    )

    expect(screen.getByText('guide.pdf')).toBeTruthy()
    expect(screen.getByText('24 chunks')).toBeTruthy()
    expect(screen.getByText('Introduction')).toBeTruthy()
    expect(screen.getByText('This is the beginning of the guide.')).toBeTruthy()
  })
})
