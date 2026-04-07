import type { CanonicalStreamEvent } from './types'

export type StreamSink = (event: CanonicalStreamEvent) => Promise<void> | void
