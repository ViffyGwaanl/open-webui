import { ClaudeAdapter } from './adapters/claude'
import { GeminiAdapter } from './adapters/gemini'
import { OpenAIAdapter } from './adapters/openai'
import type { ProviderAdapter, ProviderPreset } from './types'

function assertUnreachable(value: never): never {
  throw new Error(`Unsupported provider preset: ${value}`)
}

export class ProviderRegistry {
  resolve(presetType: ProviderPreset): ProviderAdapter {
    switch (presetType) {
      case 'openai':
        return new OpenAIAdapter()
      case 'gemini':
        return new GeminiAdapter()
      case 'claude':
        return new ClaudeAdapter()
      default:
        return assertUnreachable(presetType)
    }
  }
}
