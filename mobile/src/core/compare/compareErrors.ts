export type CompareErrorCategory =
  | 'auth'
  | 'quota'
  | 'timeout'
  | 'model_unavailable'
  | 'malformed_endpoint'
  | 'unsupported_capability'
  | 'transient_network'
  | 'unknown'

export type NormalizedCompareError = {
  category: CompareErrorCategory
  message: string
  statusCode?: number
}

type ErrorLike = {
  message?: string
  status?: number
  statusCode?: number
}

function resolveStatusCode(error: unknown) {
  if (typeof error === 'object' && error !== null) {
    const maybeError = error as ErrorLike
    return maybeError.statusCode ?? maybeError.status
  }

  return undefined
}

function resolveMessage(error: unknown) {
  if (typeof error === 'string') {
    return error
  }

  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as ErrorLike).message
    if (typeof message === 'string') {
      return message
    }
  }

  return 'Unknown compare error'
}

export function normalizeCompareError(error: unknown): NormalizedCompareError {
  const statusCode = resolveStatusCode(error)
  const message = resolveMessage(error)
  const normalizedMessage = message.toLowerCase()

  let category: CompareErrorCategory = 'unknown'

  if (
    statusCode === 401 ||
    statusCode === 403 ||
    normalizedMessage.includes('invalid api key') ||
    normalizedMessage.includes('unauthorized')
  ) {
    category = 'auth'
  } else if (
    statusCode === 429 ||
    normalizedMessage.includes('quota') ||
    normalizedMessage.includes('rate limit')
  ) {
    category = 'quota'
  } else if (normalizedMessage.includes('timeout')) {
    category = 'timeout'
  } else if (
    statusCode === 404 ||
    normalizedMessage.includes('model unavailable') ||
    normalizedMessage.includes('not found')
  ) {
    category = 'model_unavailable'
  } else if (
    statusCode === 400 ||
    normalizedMessage.includes('bad request') ||
    normalizedMessage.includes('malformed')
  ) {
    category = 'malformed_endpoint'
  } else if (normalizedMessage.includes('unsupported')) {
    category = 'unsupported_capability'
  } else if (
    statusCode === 408 ||
    statusCode === 502 ||
    statusCode === 503 ||
    statusCode === 504 ||
    normalizedMessage.includes('network')
  ) {
    category = 'transient_network'
  }

  return {
    category,
    message,
    statusCode
  }
}
