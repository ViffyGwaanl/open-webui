export type NormalizedProviderErrorCode =
  | 'authentication'
  | 'configuration'
  | 'network'
  | 'rate_limit'
  | 'unknown'

export type NormalizedProviderError = {
  code: NormalizedProviderErrorCode
  title: string
  message: string
  retryable: boolean
}
