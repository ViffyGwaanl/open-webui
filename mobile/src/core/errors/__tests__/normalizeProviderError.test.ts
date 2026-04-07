import { describe, expect, it } from '@jest/globals'

import { normalizeProviderError } from '../normalizeProviderError'

describe('normalizeProviderError', () => {
  it('maps missing model configuration into a setup message', () => {
    expect(normalizeProviderError(new Error('No enabled model target is configured'))).toEqual(
      expect.objectContaining({
        code: 'configuration',
        title: 'Configuration Required'
      })
    )
  })

  it('maps auth failures into an authentication message', () => {
    expect(normalizeProviderError(new Error('HTTP 401 unauthorized'))).toEqual(
      expect.objectContaining({
        code: 'authentication',
        title: 'Authentication Required'
      })
    )
  })

  it('maps network failures into a retryable connection message', () => {
    expect(normalizeProviderError(new Error('Network request failed'))).toEqual(
      expect.objectContaining({
        code: 'network',
        title: 'Connection Failed',
        retryable: true
      })
    )
  })
})
