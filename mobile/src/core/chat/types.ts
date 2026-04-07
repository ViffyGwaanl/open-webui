export type CanonicalUsage = {
  inputTokens: number
  outputTokens: number
}

export type CanonicalStreamEvent =
  | { type: 'response_started' }
  | { type: 'text_delta'; text: string }
  | { type: 'response_completed'; usage: CanonicalUsage }
  | { type: 'response_failed'; message: string }
