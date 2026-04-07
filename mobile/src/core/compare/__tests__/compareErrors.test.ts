import { describe, expect, it } from '@jest/globals'

import { normalizeCompareError } from '../compareErrors'

describe('normalizeCompareError', () => {
  it('classifies timeout failures into a stable compare error category', () => {
    expect(normalizeCompareError(new Error('Request timeout after 30s'))).toEqual(
      expect.objectContaining({
        category: 'timeout'
      })
    )
  })

  it('maps auth failures from provider payloads', () => {
    expect(
      normalizeCompareError({
        message: 'Invalid API key',
        status: 401
      })
    ).toEqual(
      expect.objectContaining({
        category: 'auth'
      })
    )
  })
})
