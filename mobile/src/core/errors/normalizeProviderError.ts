import type { NormalizedProviderError } from './types'

function extractMessage(error: unknown) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message.trim()
  }

  return 'Unknown provider error'
}

export function normalizeProviderError(error: unknown): NormalizedProviderError {
  const message = extractMessage(error)
  const lowerMessage = message.toLowerCase()

  if (
    lowerMessage.includes('401') ||
    lowerMessage.includes('403') ||
    lowerMessage.includes('unauthorized') ||
    lowerMessage.includes('invalid api key')
  ) {
    return {
      code: 'authentication',
      title: 'Authentication Required',
      message: 'Check the provider API key, custom base URL, and account access for this model.',
      retryable: false
    }
  }

  if (
    lowerMessage.includes('no enabled model target') ||
    lowerMessage.includes('at least two enabled provider chat models') ||
    lowerMessage.includes('embedding target')
  ) {
    return {
      code: 'configuration',
      title: 'Configuration Required',
      message: 'Finish provider setup in Settings before sending this request.',
      retryable: false
    }
  }

  if (
    lowerMessage.includes('429') ||
    lowerMessage.includes('rate limit') ||
    lowerMessage.includes('too many requests')
  ) {
    return {
      code: 'rate_limit',
      title: 'Rate Limited',
      message: 'The provider is throttling requests. Wait briefly and try again.',
      retryable: true
    }
  }

  if (
    lowerMessage.includes('timeout') ||
    lowerMessage.includes('timed out') ||
    lowerMessage.includes('network request failed') ||
    lowerMessage.includes('fetch failed') ||
    lowerMessage.includes('enotfound') ||
    lowerMessage.includes('econnrefused')
  ) {
    return {
      code: 'network',
      title: 'Connection Failed',
      message: 'The provider could not be reached. Check connectivity and the configured base URL, then retry.',
      retryable: true
    }
  }

  return {
    code: 'unknown',
    title: 'Request Failed',
    message,
    retryable: false
  }
}
